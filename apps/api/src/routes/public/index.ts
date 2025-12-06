import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";

import publicProfileRoutes from "./profiles/index.js";

const app = new Hono<AppEnv>()
  .route('/profiles', publicProfileRoutes)

export default app;
