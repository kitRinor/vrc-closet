import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { TEMP_USER_ID } from '@/const';
import { _template_ } from '@/db/schema/_template_';

const factory = createFactory();

export const listItems = factory.createHandlers(
  zValidator('query', baseQueryForGetList(_template_, {
    sortKeys: ['id', 'createdAt'],
    filterKeys: ['id', 'createdAt'],
  })),
  async (c) => {
    try {
      const { limit, offset, sort, order, filter } = c.req.valid('query');
      
      const allAvatars = await db.select().from(_template_)
        .where(generateCondition(_template_, filter, TEMP_USER_ID))
        .orderBy(generateSorting(_template_, order, sort))
        .limit(limit)
        .offset(offset);

      return c.json(allAvatars, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);