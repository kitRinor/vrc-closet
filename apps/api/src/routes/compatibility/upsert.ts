import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { compatibility } from '@/db/schema/compatibility';
import { de } from 'zod/locales';



const JsonSchema = z.object({
  avatarId: z.string().uuid(),
  itemId: z.string().uuid(),
  status: z.enum(['official', 'modified', 'unsupported']),
});

const upsert = new Hono<AppEnv>()
  .post(
    '/', 
    zValidator('json', JsonSchema),
    async (c) => {
      try {
        const { avatarId, itemId, status } = c.req.valid('json');
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ error: 'Unauthorized' }, 401);
        }

        // Check if the record already exists for this user
        const existing = await db.select()
          .from(compatibility)
          .where(and(
            eq(compatibility.userId, userId), // Ensure specific user
            eq(compatibility.avatarId, avatarId),
            eq(compatibility.itemId, itemId)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          await db.update(compatibility)
            .set({ status, updatedAt: new Date() })
            .where(and(
              eq(compatibility.userId, userId),
              eq(compatibility.avatarId, avatarId),
              eq(compatibility.itemId, itemId)
            ));
        } else {
          // Insert new record
          await db.insert(compatibility).values({
            userId,
            avatarId,
            itemId,
            status,
          });
        }

        return c.json({ success: true }, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update compatibility' }, 500);
      }
    }
  );

export default upsert;