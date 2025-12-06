import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import create from './create';
import get from './get';
import update from './update';
import del from './delete';
import { assetCategoryEnum } from '@/db/schema/assets';
type AssetCategory = "avatar" | "cloth" | "hair" | "accessory" | "texture" | "prop" | "gimmick" | "other";
export interface AssetRes {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  sourceKey: string | null;
  category: AssetCategory;
  storeUrl: string | null;
  imageUrl: string | null;
  createdAt: Date | null;
}

const app = new Hono<AppEnv>()
  .route('/', list)
  .route('/', create)
  .route('/', get)
  .route('/', update)
  .route('/', del);

export default app;