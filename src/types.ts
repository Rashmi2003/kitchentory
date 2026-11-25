export type Location='Refrigerator'|'Freezer'|'Pantry'|'Other';
export type ItemStatus='active'|'discarded';
export type InventoryItem={id:string;name:string;category:string;quantity:number;location:Location;barcode?:string;expiration?:string;estimated:boolean;status:ItemStatus;householdId:string;updatedAt:string};
export type Recipe={id:string;name:string;image:string;cuisine:string;time:number;ingredients:string[];instructions:string[];equipment:string[];dietary:string[];allergies:string[];saved?:boolean;manual?:boolean};
export type User={email:string;name:string;role:'owner'|'member'|'nonmember';householdId?:string};
