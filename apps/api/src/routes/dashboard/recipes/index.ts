import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import get from './get';
import create from './create';
import update from './update';
import del from './delete';
import { requireAuth } from '@/middleware/auth';
import { recipeStateEnum } from '@/db/schema/recipes';

// Define the response interface for type safety
type RecipeState = 'private' | 'public' | 'unlisted';
export interface RecipeRes {
  id: string;
  userId: string;
  name: string;
  state: RecipeState;
  imageUrl: string | null;
  baseAssetId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // add other fields here
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
  }>;
}

const app = new Hono<AppEnv>()
  .use(requireAuth)
  .route('/', list)
  .route('/', create)
  .route('/', get)
  .route('/', update)
  .route('/', del);

export default app;