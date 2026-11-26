import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { databaseStatus, getDatabaseRecipes } from './recipe-database.mjs';

const app = express();
app.use(express.json({ limit: '1mb' }));
let requestNumber = 0;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/recipes/status', (req, res) => {
  const status = databaseStatus();
  res.status(status.available ? 200 : 503).json(status.available ? status : { error: 'database_unavailable', message: 'Recipe database unavailable.' });
});

app.post(['/api/recipes/recommendations', '/api/generate-recipes'], (req, res) => {
  requestNumber += 1;
  const inventory = Array.isArray(req.body?.inventory) ? req.body.inventory : [];
  const selectedIngredients = Array.isArray(req.body?.selectedIngredients) ? req.body.selectedIngredients : [];
  const result = getDatabaseRecipes({ inventory, selectedIngredients, preferences: req.body?.preferences || {} });
  if (result.error) return res.status(503).json({ error: result.error, message: 'Recipe database unavailable.' });
  console.log(`[recipe-database] request=${requestNumber} inventory=${inventory.length} selected=${selectedIngredients.length} results=${result.recipes.length}`);
  return res.json({ source: 'sqlite', recipes: result.recipes, notice: result.recipes.length ? 'Kitchentory recipe database recommendations.' : 'No matching recipes found for these ingredients and filters.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('dist')));
  app.use((req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`Kitchentory catalog server listening on http://localhost:${port}`));
