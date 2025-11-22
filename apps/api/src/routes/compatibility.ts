import { Hono } from 'hono';
import { db, compatibility } from '@repo/db';
import { eq, and } from 'drizzle-orm';
import { TEMP_USER_ID } from '../const';

const app = new Hono()

// POST /compatibility
.post('/', async (c) => {
  try {
    const { avatarId, itemId, status } = await c.req.json();

    if (!avatarId || !itemId || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if the record already exists
    const existing = await db.select()
      .from(compatibility)
      .where(and(
        eq(compatibility.avatarId, avatarId),
        eq(compatibility.itemId, itemId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db.update(compatibility)
        .set({ status, updatedAt: new Date() })
        .where(and(
          eq(compatibility.avatarId, avatarId),
          eq(compatibility.itemId, itemId)
        ));
    } else {
      // Insert new record
      await db.insert(compatibility).values({
        userId: TEMP_USER_ID,
        avatarId,
        itemId,
        status,
      });
    }

    return c.json({ success: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to update compatibility' }, 500);
  }
})

// PUT /compatibility/:avatarId/:itemId
.put('/:avatarId/:itemId', async (c) => {
  try {
    const avatarId = c.req.param('avatarId');
    const itemId = c.req.param('itemId');
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const updatedCount = await db.update(compatibility)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(compatibility.avatarId, avatarId),
        eq(compatibility.itemId, itemId)
      ))
      .returning()
      .then(res => res.length);

    if (updatedCount === 0) {
      return c.json({ error: 'Compatibility record not found' }, 404);
    }

    return c.json({ success: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to update compatibility' }, 500);
  }
})

export default app;