import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { Hono } from 'hono';
// import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';

// Import sub-apps
import matrixRoute from './routes/matrix';
import avatarsRoute from './routes/avatars';
import itemsRoute from './routes/items';
import compatibilityRoute from './routes/compatibility';
import outfitsRoute from './routes/outfits';

config();

const app = new Hono();

// Global Middleware
// Allow CORS for Frontend
app.use('/*', cors({
  origin: process.env.WEB_ORIGIN_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
}));

// Mount routes
const routes = app
  .route('/matrix', matrixRoute)
  .route('/avatars', avatarsRoute)
  .route('/items', itemsRoute)
  .route('/compatibility', compatibilityRoute)
  .route('/outfits', outfitsRoute);

export type AppType = typeof routes;

const port = Number(process.env.API_PORT) || 8787;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
