
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { ProfileRes } from '.';
import { MAX_USER_DISPLAY_NAME_LENGTH, MIN_USER_DISPLAY_NAME_LENGTH, USER_HANDLE_REGEX } from '@/const';


const jsonValidator = zValidator('json', z.object({
  handle: z.string().regex(USER_HANDLE_REGEX),
  displayName: z.string().min(MIN_USER_DISPLAY_NAME_LENGTH).max(MAX_USER_DISPLAY_NAME_LENGTH).nullable(),
  bio: z.string().max(160).nullable(),
  avatarUrl: z.string().optional(),
}).partial());

const update = new Hono<AppEnv>()
  .put(
    '/', 
    jsonValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const body = c.req.valid('json');


        const result = await db.update(profiles)
          .set({
            ...body,
          })
          .where(and(
            eq(profiles.userId, userId),
          ))
          .returning();

        if (result.length === 0) {
          return c.json({ error: 'not found' }, 404);
        }

        return c.json<ProfileRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update' }, 500);
      }
    }
  );
export default update;