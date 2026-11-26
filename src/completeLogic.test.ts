import { describe, expect, it } from 'vitest';
import { buildRecipeGenerationPayload, toggleSavedRecipe, validateGeneratedRecipes } from './completeLogic';

const settings:any={name:'Kitchen',members:[],dietary:[],allergies:[],cuisines:[],maxTime:60,equipment:['Pan']};
const items:any=[{id:'spinach',name:'Spinach',quantity:1,status:'active',expiration:'2026-11-26'},{id:'pasta',name:'Pasta',quantity:2,status:'active',expiration:'2026-12-20'}];
const recipe=(n:number)=>({title:`Recipe ${n}`,image:`https://example.com/${n}.jpg`,description:'A detailed imported recipe summary.',cuisine:'Italian',servings:2,preparationTime:10,cookingTime:20,difficulty:'Easy',ingredients:[{name:'Spinach',amount:'1 cup'}],instructions:['Wash the spinach.','Heat the pan.','Cook until tender.','Serve immediately.'],availableIngredients:['Spinach'],missingIngredients:[],expiringIngredients:[],source:{provider:'TheMealDB',imageUrl:`https://example.com/${n}.jpg`}});

describe('recipe generation contracts',()=>{
  it('automatically sends all active inventory and no required selections',()=>{const payload=buildRecipeGenerationPayload(items,settings,[],'','2026-11-25');expect(payload.selectedIngredients).toEqual([]);expect(payload.inventory).toHaveLength(2);expect(payload.inventory[0].daysUntilExpiration).toBe(1);});
  it('filters selected ingredients while retaining the inventory context',()=>{const payload=buildRecipeGenerationPayload(items,settings,['Pasta'],'','2026-11-25');expect(payload.selectedIngredients).toEqual(['Pasta']);expect(payload.inventory).toHaveLength(2);});
  it('rejects a zero-recipe response and accepts complete imported records',()=>{expect(validateGeneratedRecipes({recipes:[]})).toBeNull();expect(validateGeneratedRecipes({recipes:Array.from({length:5},(_,i)=>recipe(i))})).toHaveLength(5);});
  it('rejects incomplete recipe records',()=>{expect(validateGeneratedRecipes({recipes:[{...recipe(1),instructions:['only one']}]})).toBeNull();});
  it('saves and unsaves database recipe records',()=>{const saved=toggleSavedRecipe([{...recipe(1),id:'db-1',saved:false} as any], 'db-1');expect(saved[0].saved).toBe(true);const unsaved=toggleSavedRecipe(saved,'db-1');expect(unsaved[0].saved).toBe(false);});
});
