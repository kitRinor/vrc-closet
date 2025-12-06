import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";

import s3Route from "./s3";
import proxyRoute from "./proxy";
import profileRoute from "./profile";
import assetsRoute from "./assets";
import recipesRoute from "./recipes";
import { requireAuth } from "@/middleware/auth";

const app = new Hono<AppEnv>()
  .use(requireAuth) // need authentication for all routes
  .route('/s3', s3Route)  
  .route('/proxy', proxyRoute)
  .route('/profile', profileRoute)
  .route('/assets', assetsRoute)
  .route('/recipes', recipesRoute); // for backward compatibility

export default app;
