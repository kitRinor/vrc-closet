import { Hono } from 'hono';
import { db, Item, items } from '@repo/db';
import { TEMP_USER_ID } from '../const';
import { eq } from 'drizzle-orm';

const app = new Hono()

// POST /items 
.post('/', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name) return c.json({ error: 'Name is required' }, 400);

    const result = await db.insert(items).values({
      name: body.name,
      category: body.category || 'cloth', // Default to 'cloth'
      userId: TEMP_USER_ID,
    }).returning();

    return c.json<Item>(result[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to create item' }, 500);
  }
})

//PUT /items/:id
.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    if (!body.name) return c.json({ error: 'Name is required' }, 400);

    const updatedCount = await db.update(items)
      .set({
        name: body.name,
        category: body.category,
        // updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning()
      .then(res => res.length);

    if (updatedCount === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }

    return c.json({ success: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to update item' }, 500);
  }
})

// GET /items
.get('/', async (c) => {
  try {
    const allItems = await db.select().from(items).orderBy(items.id);
    return c.json<Item[]>(allItems);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch items' }, 500);
  }
})

// GET /items/:id
.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (item.length === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }
    return c.json<Item>(item[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch item' }, 500);
  }
})

// DELETE /items/:id
.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedCount = await db.delete(items).where(eq(items.id, id)).returning().then(res => res.length);

    if (deletedCount === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }

    return c.json({ success: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to delete item' }, 500);
  }
})

export default app;