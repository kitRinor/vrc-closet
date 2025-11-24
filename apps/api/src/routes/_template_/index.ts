import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import get from './get';
import create from './create';
import update from './update';
import del from './delete';

const app = new Hono<AppEnv>()
  .route('/', list)
  .route('/', create)
  .route('/', get)
  .route('/', update)
  .route('/', del);

export default app;