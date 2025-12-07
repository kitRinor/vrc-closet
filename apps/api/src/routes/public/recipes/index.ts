import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import get from './get';
import { requireAuth } from '@/middleware/auth';
import { recipeStateEnum } from '@/db/schema/recipes';

// Define the response interface for type safety
type RecipeState = 'private' | 'public' | 'unlisted';
export interface PubRecipeRes {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  state: RecipeState;
  imageUrl: string | null;
  baseAssetId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // add other fields here
  user: {
    id: string;
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  baseAsset: {
    name: string;
    storeUrl: string | null;
    imageUrl: string | null;
    category: string | null;
  } | null;
  steps: Array<{
    id: string;
    stepNumber: number;
    name: string;
    description: string;
    imageUrl: string | null;
  }>;
  assets: Array<{
    id: string;
    assetId: string;
    note: string | null;
    configuration: any;
    asset: {
      name: string;
      storeUrl: string | null;
      imageUrl: string | null;
      category: string | null;
    } | null;
  }>;
}

const app = new Hono<AppEnv>()
  .route('/', list)
  .route('/', get)

export default app;