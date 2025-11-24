import { Hono } from 'hono';
import { AppEnv } from '@/type';

import upsert from './upsert';
import update from './update';

const app = new Hono<AppEnv>()
  .route('/', upsert)
  .route('/', update); 

export default app;