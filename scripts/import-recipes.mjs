import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(root, 'data');
const databasePath = path.join(dataDir, 'kitchentory.sqlite');
const apiBase = 'https://api.spoonacular.com/recipes';
const cuisines = ['Indian', 'Italian', 'Mexican', 'Japanese', 'Mediterranean', 'American', 'Thai', 'Korean', 'Chinese', 'French'];
const targetPerCuisine = Number(process.env.RECIPES_PER_CUISINE || 10);

function loadProjectEnv() {
  return fs.readFile(path.join(root, '.env'), 'utf8').then(contents => {
    const values = {};
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
    return values;
  });
}

function sqlString(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function runSqlite(database, sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('sqlite3', [database], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => reject(error));
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`sqlite3 failed: ${stderr.trim() || `exit ${code}`}`)));
    child.stdin.end(sql);
  });
}

async function spoonacular(pathname, apiKey, params = {}) {
  const url = new URL(`${apiBase}${pathname}`);
  url.searchParams.set('apiKey', apiKey);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  let response;
  try { response = await fetch(url); } catch { throw new Error('Could not reach Spoonacular during the one-time import.'); }
  if (!response.ok) throw new Error(`Spoonacular request failed with HTTP ${response.status}`);
  return response.json();
}

function instructionsFrom(detail) {
  const steps = (detail.analyzedInstructions || []).flatMap(section => section.steps || [])
    .filter(step => Number.isInteger(step.number) && String(step.step || '').trim())
    .map(step => ({ number: step.number, text: String(step.step).trim() }));
  return steps.length ? steps : null;
}

function ingredientsFrom(detail) {
  return (detail.extendedIngredients || []).map((ingredient, index) => ({
    position: index + 1,
    name: String(ingredient.name || ingredient.originalName || '').trim(),
    amount: ingredient.amount == null ? '' : String(ingredient.amount),
    unit: String(ingredient.unit || '').trim(),
    original: String(ingredient.original || '').trim()
  })).filter(ingredient => ingredient.name && ingredient.amount && ingredient.original);
}

function equipmentFrom(detail) {
  const names = (detail.analyzedInstructions || []).flatMap(section => section.steps || []).flatMap(step => step.equipment || [])
    .map(item => String(item.name || '').trim()).filter(Boolean);
  return [...new Set(names)];
}

function completeRecord(detail) {
  const ingredients = ingredientsFrom(detail);
  const instructions = instructionsFrom(detail);
  const actualCuisine = Array.isArray(detail.cuisines) ? detail.cuisines.map(String).map(value => value.trim()).filter(Boolean)[0] : '';
  if (!detail.id || !String(detail.title || '').trim() || !String(detail.image || '').trim() || !String(detail.sourceUrl || '').trim() || !actualCuisine || ingredients.length < 2 || !instructions || instructions.length < 3) return null;
  return {
    sourceId: String(detail.id),
    title: String(detail.title).trim(),
    summary: String(detail.summary || '').trim(),
    cuisine: actualCuisine,
    sourceUrl: String(detail.sourceUrl).trim(),
    imageUrl: String(detail.image).trim(),
    servings: Number.isFinite(Number(detail.servings)) ? Number(detail.servings) : null,
    preparationTime: Number.isFinite(Number(detail.preparationMinutes)) ? Number(detail.preparationMinutes) : null,
    cookingTime: Number.isFinite(Number(detail.cookingMinutes)) ? Number(detail.cookingMinutes) : null,
    difficulty: null,
    ingredients,
    instructions,
    dietary: Array.isArray(detail.diets) ? detail.diets.map(String).map(value => value.trim()).filter(Boolean) : [],
    allergens: Array.isArray(detail.intolerances) ? detail.intolerances.map(String).map(value => value.trim()).filter(Boolean) : [],
    equipment: equipmentFrom(detail)
  };
}

function schemaSql() {
  return `PRAGMA foreign_keys = ON;
CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT NOT NULL, cuisine TEXT NOT NULL, source_url TEXT NOT NULL, image_url TEXT NOT NULL, servings REAL, preparation_time INTEGER, cooking_time INTEGER, difficulty TEXT);
CREATE TABLE recipe_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, position INTEGER NOT NULL, name TEXT NOT NULL, amount TEXT NOT NULL, unit TEXT NOT NULL, original TEXT NOT NULL);
CREATE TABLE recipe_instructions (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, step_number INTEGER NOT NULL, instruction TEXT NOT NULL);
CREATE TABLE recipe_dietary_labels (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, label TEXT NOT NULL);
CREATE TABLE recipe_allergens (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, allergen TEXT NOT NULL);
CREATE TABLE recipe_equipment (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, equipment TEXT NOT NULL);
CREATE INDEX recipes_cuisine_idx ON recipes(cuisine);
CREATE INDEX recipe_ingredients_name_idx ON recipe_ingredients(name);
`;
}

function recordsSql(records) {
  const lines = ['BEGIN TRANSACTION;'];
  for (const recipe of records) {
    lines.push(`INSERT INTO recipes (source_id,title,summary,cuisine,source_url,image_url,servings,preparation_time,cooking_time,difficulty) VALUES (${sqlString(recipe.sourceId)},${sqlString(recipe.title)},${sqlString(recipe.summary)},${sqlString(recipe.cuisine)},${sqlString(recipe.sourceUrl)},${sqlString(recipe.imageUrl)},${recipe.servings ?? 'NULL'},${recipe.preparationTime ?? 'NULL'},${recipe.cookingTime ?? 'NULL'},${recipe.difficulty == null ? 'NULL' : sqlString(recipe.difficulty)});`);
    const recipeId = `(SELECT id FROM recipes WHERE source_id=${sqlString(recipe.sourceId)})`;
    for (const ingredient of recipe.ingredients) lines.push(`INSERT INTO recipe_ingredients (recipe_id,position,name,amount,unit,original) VALUES (${recipeId},${ingredient.position},${sqlString(ingredient.name)},${sqlString(ingredient.amount)},${sqlString(ingredient.unit)},${sqlString(ingredient.original)});`);
    for (const instruction of recipe.instructions) lines.push(`INSERT INTO recipe_instructions (recipe_id,step_number,instruction) VALUES (${recipeId},${instruction.number},${sqlString(instruction.text)});`);
    for (const label of recipe.dietary) lines.push(`INSERT INTO recipe_dietary_labels (recipe_id,label) VALUES (${recipeId},${sqlString(label)});`);
    for (const allergen of recipe.allergens) lines.push(`INSERT INTO recipe_allergens (recipe_id,allergen) VALUES (${recipeId},${sqlString(allergen)});`);
    for (const equipment of recipe.equipment) lines.push(`INSERT INTO recipe_equipment (recipe_id,equipment) VALUES (${recipeId},${sqlString(equipment)});`);
  }
  lines.push('COMMIT;');
  return lines.join('\n');
}

async function main() {
  let env;
  try { env = await loadProjectEnv(); } catch { throw new Error('Project-root .env is missing. Add SPOONACULAR_API_KEY there before importing recipes.'); }
  const apiKey = env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error('SPOONACULAR_API_KEY is missing from the project-root .env file.');
  const candidates = new Map();
  for (const cuisine of cuisines) {
    const result = await spoonacular('/complexSearch', apiKey, { cuisine, number: targetPerCuisine, offset: 0, addRecipeInformation: false });
    for (const recipe of result.results || []) candidates.set(recipe.id, recipe.id);
  }
  const records = [];
  for (const id of candidates.keys()) {
    const detail = await spoonacular(`/${id}/information`, apiKey, { includeNutrition: false });
    const record = completeRecord(detail);
    if (record) records.push(record);
  }
  if (records.length < 100) throw new Error(`Only ${records.length} complete Spoonacular recipes were available; refusing to create an incomplete database.`);
  await fs.mkdir(dataDir, { recursive: true });
  const temporaryDatabase = `${databasePath}.tmp-${process.pid}`;
  await fs.rm(temporaryDatabase, { force: true });
  await runSqlite(temporaryDatabase, schemaSql() + recordsSql(records));
  await fs.rename(temporaryDatabase, databasePath);
  console.log(`Imported ${records.length} complete recipes into data/kitchentory.sqlite.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
