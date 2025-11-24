import { Hono } from 'hono';
import { db } from '../db';
import { TEMP_USER_ID } from '../const';
import { and, eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { baseQueryForGetList } from '../lib/validator';
import { generateCondition } from '../lib/queryUtils/filter';
import { generateSorting } from '../lib/queryUtils/sort';
import { Avatar, avatars } from '../db/schema/avatars';
import z from 'zod';


// must write as chain method to make collect type-completion at hono-rpc

const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));
const queryValidator = zValidator('query', baseQueryForGetList(avatars, {
  sortKeys: ['id', 'createdAt'],
  filterKeys: ['id', 'name', 'createdAt'],
}));
const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  storeUrl: z.url().optional(),
  thumbnailUrl: z.string().optional(),
}));

// Hono app for /avatars routes
const app = new Hono()

// POST /avatars
.post('/', jsonValidator, async (c) => {
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
  }
)

// GET /avatars
.get('/', queryValidator, async (c) => {
  try {
    const { limit, offset, sort, order, filter } = c.req.valid('query');
    console.log({ limit, offset, sort, order, filter });
    const allAvatars = await db.select().from(avatars)
      .where(generateCondition(avatars, filter, TEMP_USER_ID))
      .orderBy(generateSorting(avatars, order, sort))
      .limit(limit)
      .offset(offset);
    return c.json<Avatar[]>(allAvatars);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch avatars' }, 500);
  }
})

// GET /avatars/:id
.get('/:id', paramValidator, async (c) => {
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


// PUT /avatars/:id
.put('/:id', paramValidator, jsonValidator, async (c) => {
  try {
    const id = c.req.param('id');
    const body = c.req.valid('json');

    const result = await db.update(avatars)
      .set({
        name: body.name,
        storeUrl: body.storeUrl || null,
        thumbnailUrl: body.thumbnailUrl || null,
      })
      .where(and(
        eq(avatars.id, id),
      ))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Avatar not found' }, 404);
    }

    return c.json<Avatar>(result[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to update avatar' }, 500);
  }
})

// DELETE /avatars/:id
.delete('/:id', paramValidator, async (c) => {
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