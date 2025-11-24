import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import create from './create';
import get from './get';
import update from './update';
import del from './delete';

const app = new Hono<AppEnv>()
  .route('/', list)
  .route('/', create)
  .route('/:id', get)
  .route('/:id', update)
  .route('/:id', del);

export default app;