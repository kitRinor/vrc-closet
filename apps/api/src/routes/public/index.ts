import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";

import publicProfileRoutes from "./profiles/index.js";
import publicRecipeRoutes from "./recipes/index.js";

const app = new Hono<AppEnv>()
  .route('/profiles', publicProfileRoutes)
  .route('/recipes', publicRecipeRoutes)

export default app;
