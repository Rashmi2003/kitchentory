import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const databasePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'kitchentory_recipes.sqlite');
let database;
let databaseError = null;
try { database = new Database(databasePath, { readonly: true }); } catch (error) { databaseError = error; }

const normalize = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ');
const sameIngredient = (left, right) => { const a = normalize(left).replace(/s$/, ''); const b = normalize(right).replace(/s$/, ''); return a === b || a.includes(b) || b.includes(a); };
const meat = /beef|chicken|pork|lamb|turkey|bacon|ham|sausage|chorizo|meat|fish|seafood|shrimp|prawn|salmon|tuna|crab|lobster|anchov|pilchard/i;
const animal = /(^|\s)(milk|cheese|butter|cream|yogurt|egg|honey|dairy|paneer|ghee|feta|parmesan|mozzarella|mayonnaise)(\s|$)/i;
const blockedByDiet = (ingredients, labels, diets) => diets.some(diet => {
  if (!labels.includes(diet)) return true;
  const text = ingredients.join(' ');
  return diet === 'vegetarian' ? meat.test(text) : diet === 'vegan' && (meat.test(text) || (animal.test(text) && !/coconut milk/i.test(text)));
});

function rowsForRecipe(recipe) {
  const ingredients = database.prepare('SELECT position, name, quantity FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position').all(recipe.id).map(row => ({ name: row.name, amount: row.quantity }));
  const instructions = database.prepare('SELECT position, instruction FROM recipe_instructions WHERE recipe_id = ? ORDER BY position').all(recipe.id).map(row => row.instruction);
  const dietary = database.prepare('SELECT label FROM recipe_dietary WHERE recipe_id = ? ORDER BY label').all(recipe.id).map(row => row.label);
  const allergies = database.prepare('SELECT label FROM recipe_allergens WHERE recipe_id = ? ORDER BY label').all(recipe.id).map(row => row.label);
  const equipment = database.prepare('SELECT label FROM recipe_equipment WHERE recipe_id = ? ORDER BY label').all(recipe.id).map(row => row.label);
  return { ...recipe, name: recipe.title, image: recipe.image_url, time: recipe.total_minutes, prepTime: recipe.prep_minutes, cookTime: recipe.cook_minutes, difficulty: recipe.difficulty || 'Not specified', ingredients, optionalIngredients: [], instructions, dietary, allergies, equipment, notes: recipe.summary, source: { provider: recipe.source_name, id: recipe.id, url: recipe.source_url, pageUrl: recipe.source_url, imageUrl: recipe.image_url }, saved: false };
}

export function databaseStatus() { return { available: Boolean(database), path: databasePath, error: databaseError?.message || null }; }

export function getDatabaseRecipes(payload = {}) {
  if (!database) return { error: 'database_unavailable', recipes: [] };
  const inventory = Array.isArray(payload.inventory) ? payload.inventory : [];
  const selected = Array.isArray(payload.selectedIngredients) ? payload.selectedIngredients : [];
  const preferences = payload.preferences || {};
  const usable = inventory.filter(item => item.status !== 'discarded' && Number(item.quantity) > 0 && item.usable !== false && (item.daysUntilExpiration == null || item.daysUntilExpiration >= 0));
  const cuisine = normalize(preferences.preferredCuisine);
  const diets = (preferences.dietaryRestrictions || []).map(normalize);
  const allergies = (preferences.allergies || []).map(normalize);
  const equipment = (preferences.availableEquipment || []).map(normalize);
  const maxTime = Number(preferences.maximumCookingTime);
  const recipes = database.prepare('SELECT * FROM recipes ORDER BY id').all().map(rowsForRecipe).filter(recipe => {
    if (cuisine && normalize(recipe.cuisine) !== cuisine) return false;
    if (Number.isFinite(maxTime) && recipe.total_minutes > maxTime) return false;
    if (diets.length && blockedByDiet(recipe.ingredients.map(item => item.name), recipe.dietary.map(normalize), diets)) return false;
    if (allergies.some(allergy => recipe.allergies.map(normalize).includes(allergy) || recipe.ingredients.some(item => normalize(item.name).includes(allergy)))) return false;
    if (equipment.length && !recipe.equipment.every(item => equipment.includes(normalize(item)))) return false;
    const available = recipe.ingredients.filter(ingredient => usable.some(item => sameIngredient(item.name, ingredient.name)));
    return available.length > 0 && (!selected.length || selected.some(item => available.some(ingredient => sameIngredient(item, ingredient.name))));
  }).map(recipe => {
    const availableIngredients = recipe.ingredients.filter(ingredient => usable.some(item => sameIngredient(item.name, ingredient.name))).map(item => item.name);
    const missing = recipe.ingredients.filter(item => !availableIngredients.includes(item.name)).map(item => item.name);
    const expiringUsed = usable.filter(item => item.daysUntilExpiration != null && item.daysUntilExpiration <= 2 && recipe.ingredients.some(ingredient => sameIngredient(item.name, ingredient.name))).sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration).map(item => item.name);
    const selectedMatches = selected.filter(item => availableIngredients.some(ingredient => sameIngredient(item, ingredient))).length;
    return { ...recipe, availableIngredients, missing, expiringUsed, matched: availableIngredients.length, score: availableIngredients.length + expiringUsed.length * 2 + selectedMatches * 0.5 };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { recipes: recipes.slice(0, 8) };
}

export const recipeDatabasePath = databasePath;
