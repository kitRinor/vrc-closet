import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { TEMP_USER_ID } from '@/const';
import { avatars } from '@/db/schema/avatars';

const factory = createFactory();

export const listAvatars = factory.createHandlers(
  zValidator('query', baseQueryForGetList(avatars, {
    sortKeys: ['id', 'createdAt'],
    filterKeys: ['id', 'name', 'createdAt'],
  })),
  async (c) => {
    try {
      const { limit, offset, sort, order, filter } = c.req.valid('query');
      
      const allAvatars = await db.select().from(avatars)
        .where(generateCondition(avatars, filter, TEMP_USER_ID))
        .orderBy(generateSorting(avatars, order, sort))
        .limit(limit)
        .offset(offset);

      return c.json(allAvatars, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch avatars' }, 500);
    }
  }
);