import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { avatars } from '@/db/schema/avatars';
import { AppEnv } from '@/type';
import { Hono } from 'hono';


const paramValidator = zValidator('param', z.object({
  id: z.string().uuid(),
}));

const del = new Hono<AppEnv>()
  .delete(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const result = await db.delete(avatars).where(eq(avatars.id, id)).returning();

      if (result.length === 0) {
        return c.json({ error: 'Avatar not found' }, 404);
      }

      return c.json({ success: true }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to delete avatar' }, 500);
    }
  }
);
export default del;