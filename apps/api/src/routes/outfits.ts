import { Hono } from 'hono';
import { db, outfits, outfitItems, Outfit, OutfitItem } from '@repo/db';
import { TEMP_USER_ID } from '../const';
import { eq } from 'drizzle-orm';

type JoinedOutfit = Outfit & { items: OutfitItem[] };

const app = new Hono()

// GET /outfits
// Fetch all outfits with their base avatar and included items
.get('/', async (c) => {
  try {
    const results = await db.query.outfits.findMany({
      orderBy: (outfits, { desc }) => [desc(outfits.createdAt)],
      with: {
        avatar: true, // Include Base Avatar info
        items: {          // Include related items via junction table
          with: {
            item: true    // Include the actual Item details
          }
        }
      }
    });
    return c.json<JoinedOutfit[]>(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch outfits' }, 500);
  }
})

// GET /outfits/:id
// Fetch a single outfit by ID with its base avatar and included items
.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const outfit = await db.query.outfits.findFirst({
      where: eq(outfits.id, id),
      with: {
        avatar: true,
        items: {
          with: {
            item: true
          }
        }
      },
    });

    if (!outfit) {
      return c.json({ error: 'Outfit not found' }, 404);
    }

    return c.json<JoinedOutfit>(outfit);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch outfit' }, 500);
  }
})

// POST /outfits
// Create a new outfit and link items to it transactionally
.post('/', async (c) => {
  const { name, avatarId, itemIds, description } = await c.req.json();

  if (!name || !avatarId) {
    return c.json({ error: 'Name and avatarId are required' }, 400);
  }

  try {
    // Use transaction to ensure both outfit and relations are created, or neither
    let result: JoinedOutfit = {} as JoinedOutfit;
    await db.transaction(async (tx) => {
      // 1. Create the Outfit
      const [newOutfit] = await tx.insert(outfits).values({
        name,
        avatarId,
        description,
        userId: TEMP_USER_ID,
      }).returning();

      result = {...newOutfit, items: []};

      // 2. Link Items (if any provided)
      if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
        const relations = itemIds.map((itemId: string) => ({
          outfitId: newOutfit.id,
          itemId,
        }));
        const res = await tx.insert(outfitItems).values(relations).returning();
        result.items = res;
      }
    });

    return c.json<JoinedOutfit>(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to create outfit' }, 500);
  }
})

export default app;