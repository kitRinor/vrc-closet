import { Hono } from 'hono';
import { db, avatars, Avatar } from '@repo/db';
import { TEMP_USER_ID } from '../const';
import { eq } from 'drizzle-orm';


// must write as chain method to make collect type-completion at hono-rpc

const app = new Hono()

// POST /avatars
.post('/', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name) return c.json({ error: 'Name is required' }, 400);

    const result = await db.insert(avatars).values({
      name: body.name,
      userId: TEMP_USER_ID,
    }).returning();

    return c.json<Avatar>(result[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to create avatar' }, 500);
  }
})

// GET /avatars
.get('/', async (c) => {
  try {
    const allAvatars = await db.select().from(avatars).orderBy(avatars.id);
    return c.json<Avatar[]>(allAvatars);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch avatars' }, 500);
  }
})

// GET /avatars/:id
.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const avatar = await db.select().from(avatars).where(eq(avatars.id, id)).limit(1);

    if (avatar.length === 0) {
      return c.json({ error: 'Avatar not found' }, 404);
    }

    return c.json<Avatar>(avatar[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch avatar' }, 500);
  }
})

// DELETE /avatars/:id
.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedCount = await db.delete(avatars).where(eq(avatars.id, id)).returning().then(res => res.length);

    if (deletedCount === 0) {
      return c.json({ error: 'Avatar not found' }, 404);
    }

    return c.json({ success: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to delete avatar' }, 500);
  }
})

export default app;