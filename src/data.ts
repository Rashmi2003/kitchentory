import {InventoryItem,Recipe,User} from './types';
export const HOUSEHOLD='spartan-shared-kitchen';
export const demoUsers:Record<string,{password:string;user:User}>={
 'alex.rivera@kitchentory.test':{password:'Kitchen@131Test!',user:{email:'alex.rivera@kitchentory.test',name:'Alex Rivera',role:'owner',householdId:HOUSEHOLD}},
 'jordan.lee@kitchentory.test':{password:'Kitchen@131Test!',user:{email:'jordan.lee@kitchentory.test',name:'Jordan Lee',role:'member',householdId:HOUSEHOLD}},
 'taylor.chen@kitchentory.test':{password:'Kitchen@131Test!',user:{email:'taylor.chen@kitchentory.test',name:'Taylor Chen',role:'member',householdId:HOUSEHOLD}},
 'casey.patel@kitchentory.test':{password:'Kitchen@131Test!',user:{email:'casey.patel@kitchentory.test',name:'Casey Patel',role:'nonmember'}}};
export const seedInventory:InventoryItem[]=[
 {id:'tomato-sauce',name:'Campus Tomato Sauce',category:'Sauce',quantity:4,location:'Refrigerator',expiration:'2026-11-20',estimated:false,status:'active',householdId:HOUSEHOLD,updatedAt:'2026-11-18T09:00:00Z'},
 {id:'pasta',name:'Pasta',category:'Grains',quantity:2,location:'Pantry',expiration:'2026-12-20',estimated:false,status:'active',householdId:HOUSEHOLD,updatedAt:'2026-11-18T09:00:00Z'},
 {id:'spinach',name:'Spinach',category:'Produce',quantity:1,location:'Refrigerator',expiration:'2026-11-18',estimated:false,status:'active',householdId:HOUSEHOLD,updatedAt:'2026-11-18T09:00:00Z'},
 {id:'garlic',name:'Garlic',category:'Produce',quantity:2,location:'Pantry',expiration:'2026-11-25',estimated:true,status:'active',householdId:HOUSEHOLD,updatedAt:'2026-11-18T09:00:00Z'}];
const img=(emoji:string)=>`https://images.unsplash.com/photo-${emoji}`;
export const recipes:Recipe[]=[
 {id:'herby-lemon-pasta',name:'Herby Lemon Pasta',image:img('1556761223-4c4282c73f77'),cuisine:'Italian',time:25,ingredients:['pasta','garlic','spinach','lemon'],instructions:['Boil pasta until al dente.','Sauté garlic and spinach.','Toss together with lemon and herbs.','Serve warm.'],equipment:['Stovetop'],dietary:['vegetarian'],allergies:['gluten']},
 {id:'green-garden-bowl',name:'Green Garden Bowl',image:img('1512621776951-a57141f2eefd'),cuisine:'Mediterranean',time:20,ingredients:['spinach','tomato','garlic','rice'],instructions:['Cook rice.','Chop vegetables.','Build a bowl and season.'],equipment:['Stovetop'],dietary:['vegan','vegetarian'],allergies:[]},
 {id:'coconut-curry',name:'Coconut Curry',image:img('1601050690597-df0568f70950'),cuisine:'Indian',time:35,ingredients:['spinach','coconut milk','garlic','rice'],instructions:['Sauté garlic and spices.','Add coconut milk and spinach.','Simmer and serve over rice.'],equipment:['Stovetop'],dietary:['vegan'],allergies:[]},
 {id:'sunday-shakshuka',name:'Sunday Shakshuka',image:img('1590412200988-a436970781fa'),cuisine:'Mediterranean',time:30,ingredients:['tomato','garlic','egg','spinach'],instructions:['Simmer tomato sauce.','Add greens.','Crack in eggs and cover until set.'],equipment:['Stovetop'],dietary:['vegetarian'],allergies:['egg']},
 {id:'miso-noodle-bowl',name:'Miso Noodle Bowl',image:img('1569718212165-3a8278d5f624'),cuisine:'Japanese',time:18,ingredients:['noodles','spinach','miso','garlic'],instructions:['Make miso broth.','Cook noodles.','Add spinach and serve.'],equipment:['Stovetop'],dietary:['vegetarian'],allergies:['soy']},
 {id:'berry-breakfast-toast',name:'Berry Breakfast Toast',image:img('1495474472287-4d71bcdd2085'),cuisine:'Mediterranean',time:10,ingredients:['bread','berries','yogurt'],instructions:['Toast bread.','Top with yogurt and berries.'],equipment:['Toaster'],dietary:['vegetarian'],allergies:['gluten','dairy']}];
export const barcodeProducts:Record<string,Partial<InventoryItem>&{brand:string;packageSize:string;image:string}>={'012345678905':{name:'Campus Tomato Sauce',brand:'Kitchentory Kitchen',category:'Sauce',packageSize:'24 oz',image:'🍅'}};
