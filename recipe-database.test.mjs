import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { getDatabaseRecipes, recipeDatabasePath } from './recipe-database.mjs';

const db = new Database(recipeDatabasePath, { readonly: true });
const allIngredients = db.prepare('SELECT name FROM recipe_ingredients GROUP BY name').all().map(row => ({ name: row.name, quantity: 1, status: 'active', daysUntilExpiration: 10 }));
const preferences = { dietaryRestrictions: [], allergies: [], preferredCuisine: '', maximumCookingTime: 180, availableEquipment: [] };

describe('SQLite recipe database recommendations', () => {
  it('has 60 complete database recipes', () => {
    expect(db.prepare('SELECT COUNT(*) AS count FROM recipes').get().count).toBe(60);
    expect(db.prepare('SELECT COUNT(*) AS count FROM recipe_instructions').get().count).toBeGreaterThanOrEqual(240);
  });

  it('filters by the actual database cuisine', () => {
    const result = getDatabaseRecipes({ inventory: allIngredients, preferences: { ...preferences, preferredCuisine: 'Indian' } });
    expect(result.recipes.length).toBeGreaterThan(0);
    expect(result.recipes.every(recipe => recipe.cuisine === 'Indian')).toBe(true);
  });

  it('filters vegetarian recipes without meat', () => {
    const result = getDatabaseRecipes({ inventory: allIngredients, preferences: { ...preferences, dietaryRestrictions: ['vegetarian'] } });
    expect(result.recipes.every(recipe => !/beef|chicken|pork|lamb|turkey|bacon|ham|sausage|fish|seafood|shrimp|prawn/i.test(recipe.ingredients.map(item => item.name).join(' ')))).toBe(true);
  });

  it('filters recipes containing an allergy ingredient', () => {
    const result = getDatabaseRecipes({ inventory: allIngredients, preferences: { ...preferences, allergies: ['peanuts'] } });
    expect(result.recipes.every(recipe => !recipe.allergies.includes('peanuts') && !recipe.ingredients.some(item => /peanut/i.test(item.name)))).toBe(true);
  });

  it('keeps complete instructions and recipe-specific images together', () => {
    const result = getDatabaseRecipes({ inventory: allIngredients, preferences });
    expect(result.recipes.every(recipe => recipe.image.startsWith('http') && recipe.instructions.length >= 4 && recipe.title && recipe.source.id)).toBe(true);
  });

  it('calculates partial available and missing ingredients', () => {
    const recipe = db.prepare('SELECT * FROM recipes ORDER BY id LIMIT 1').get();
    const ingredients = db.prepare('SELECT name FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position').all(recipe.id);
    const result = getDatabaseRecipes({ inventory: [{ name: ingredients[0].name, quantity: 1, status: 'active', daysUntilExpiration: 10 }], preferences });
    const found = result.recipes.find(item => item.id === recipe.id);
    expect(found.availableIngredients).toContain(ingredients[0].name);
    expect(found.missing.length).toBeGreaterThan(0);
  });

  it('prioritizes ingredients expiring within two days', () => {
    const recipe = db.prepare('SELECT * FROM recipes ORDER BY id LIMIT 1').get();
    const ingredient = db.prepare('SELECT name FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position LIMIT 1').get(recipe.id);
    const result = getDatabaseRecipes({ inventory: [{ name: ingredient.name, quantity: 1, status: 'active', daysUntilExpiration: 1 }], preferences });
    expect(result.recipes.find(item => item.id === recipe.id).expiringUsed).toContain(ingredient.name);
  });
});
