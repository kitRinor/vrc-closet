import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";

import s3Route from "./s3";
import proxyRoute from "./proxy";
import profileRoute from "./profile";
import matrixRoute from "./matrix";
import avatarsRoute from "./avatars";
import itemsRoute from "./items";
import compatibilityRoute from "./compatibility";
import outfitsRoute from "./outfits";
import { requireAuth } from "@/middleware/auth";

const app = new Hono<AppEnv>()
  .use(requireAuth) // need authentication for all routes
  .route('/s3', s3Route)  
  .route('/proxy', proxyRoute)
  .route('/profile', profileRoute)
  .route('/matrix', matrixRoute)
  .route('/avatars', avatarsRoute)
  .route('/items', itemsRoute)
  .route('/compatibility', compatibilityRoute)
  .route('/outfits', outfitsRoute)

export default app;
