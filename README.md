# Kitchentory

A responsive household inventory and recipe-generation prototype built with React, TypeScript, and Vite.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173.

For a production build:

```bash
npm test
npm run build
PORT=4173 NODE_ENV=production npm start
```

## Local recipe database

The application reads the authoritative SQLite database at `data/kitchentory_recipes.sqlite` through the backend only. It makes no recipe-service calls during normal use. `POST /api/recipes/recommendations` applies cuisine, dietary, allergy, equipment, time, inventory, and expiration-priority rules.

To refresh the dataset intentionally, run:

```bash
node scripts/import-recipes.mjs
```

The importer preserves each source meal ID, title, URL, image URL, area/cuisine, ingredient names, measurements, and raw instructions. The app shows TheMealDB attribution and links to the original meal. Use is subject to [TheMealDB’s terms of use](https://themealdb.com/terms_of_use.php), including their source-attribution and Creative Commons artwork requirements.

`npm run dev` starts the Express catalog endpoint and Vite frontend together. `POST /api/generate-recipes` matches local imported records against household inventory, applies cuisine, dietary, allergy, equipment, time, and expiration-priority rules, and rotates matching suggestions.

## Demo login

- Email: `alex.rivera@kitchentory.test`
- Password: `Kitchen@131Test!`

Test inventory: Spinach 1 (Refrigerator, 2026-11-20), Pasta 2 (Pantry, 2026-12-20), and Tomato Sauce 1 (Pantry, 2026-11-25).

## Persistence and testing

Inventory, saved recipes, account settings, and login state persist in browser `localStorage`. Run `npm test` and `npm run build`.
