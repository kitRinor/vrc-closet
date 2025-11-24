import { serve } from '@hono/node-server';
import { Hono } from 'hono';
// import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';

// Import sub-apps
import authRoute from './routes/auth';
import s3Route from './routes/s3';
import matrixRoute from './routes/matrix';
import avatarsRoute from './routes/avatars';
import itemsRoute from './routes/items';
import compatibilityRoute from './routes/compatibility';
import outfitsRoute from './routes/outfits';
import { AppEnv } from './type';

import { config } from 'dotenv';
config();


const app = new Hono<AppEnv>();

// Global Middleware
// Allow CORS for Frontend
app.use('/*', cors({
  origin: process.env.WEB_ORIGIN_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
  credentials: true, // Cookieを許可
}));

// Apply auth middleware globally
app.use('/*', authMiddleware);


// Mount routes
const routes = app
  .route('/auth', authRoute)
  .route('/s3', s3Route)  
  .route('/matrix', matrixRoute)
  .route('/avatars', avatarsRoute)
  .route('/items', itemsRoute)
  .route('/compatibility', compatibilityRoute)
  .route('/outfits', outfitsRoute)

export type AppType = typeof routes;

const port = Number(process.env.API_PORT) || 8787;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});



