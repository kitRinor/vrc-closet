import { Hono } from 'hono';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { TEMP_USER_ID } from '../const';
import { avatars } from '@/db/schema/avatars';
import { items } from '@/db/schema/items';
import { compatibility } from '@/db/schema/compatibility';

const app = new Hono()

// GET /matrix
.get('/', async (c) => {
  try {
    // Fetch data concurrently for better performance
    const [allAvatars, allItems, allCompatibilities] = await Promise.all([
      db.select().from(avatars).where(eq(avatars.userId, TEMP_USER_ID)).orderBy(avatars.id),
      db.select().from(items).where(eq(items.userId, TEMP_USER_ID)).orderBy(items.id),
      db.select().from(compatibility).where(eq(compatibility.userId, TEMP_USER_ID)),
    ]);

    return c.json({
      avatars: allAvatars,
      items: allItems,
      compatibilities: allCompatibilities,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

export default app;