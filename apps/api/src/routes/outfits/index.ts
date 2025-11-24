import { Hono } from 'hono';
import { listItems } from './list';
import { createAvatar } from './create';
import { getAvatar } from './get';
import { updateAvatar } from './update';
import { deleteAvatar } from './delete';

const app = new Hono()
  .get('/', ...listItems)
  .post('/', ...createAvatar)
  .get('/:id', ...getAvatar)
  .put('/:id', ...updateAvatar)
  .delete('/:id', ...deleteAvatar);

export default app;