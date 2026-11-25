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

## Optional AI recipe generation

Set an environment variable locally before starting the server; never place it in frontend code or commit it:

```bash
export OPENAI_API_KEY=your-key-here
npm run dev
```

`POST /api/generate-recipes` sends selected ingredients and preferences to the server. Missing keys, rate limits, provider errors, and malformed responses produce a clear fallback state. The UI then uses complete local seeded recipes.

## Demo login

- Email: `alex.rivera@kitchentory.test`
- Password: `Kitchen@131Test!`

Test inventory: Spinach 1 (Refrigerator, 2026-11-20), Pasta 2 (Pantry, 2026-12-20), and Tomato Sauce 1 (Pantry, 2026-11-25).

## Persistence and testing

Inventory, saved recipes, account settings, and login state persist in browser `localStorage`. Run `npm test` and `npm run build`.
