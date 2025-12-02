import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";

import publicOutfitRoutes from "./outfits/index.js";
import publicProfileRoutes from "./profiles/index.js";

const app = new Hono<AppEnv>()
  .route('/profiles', publicProfileRoutes)
  .route('/outfits', publicOutfitRoutes);

export default app;
