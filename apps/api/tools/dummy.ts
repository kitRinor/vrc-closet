import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { schema } from '../src/db';

// Load environment variables
config({ path: '../../.env' });

// Constants for random generation
const N_USER = 10;
const PASSWORD_HASH = '$2b$10$zqzRLPCJqd.f.7masmO1UetcMuDug7urSBADKgHkzP5IQaJkO.5vy'; // Hash for "password"
// avatar
const N_AVATAR_PER_USER_MIN = 2;
const N_AVATAR_PER_USER_MAX = 5; // less than AVATAR_NAMES.length
const AVATAR_NAMES = [
  'Chiffon', 'Chocolat',  'Lime', 'Rusk', 
  'Manuka', 'Rurune', 'Selestia', 'Maya', 'Moe'
];
// item
const N_ITEM_PER_USER_MIN = 5;
const N_ITEM_PER_USER_MAX = 10; // less than ITEM_NAMES.length
const ITEM_NAMES = [
  'Summer Dress', 'Summer Bikini', 
  'Winter Dress', 'Winter Coat', 
  'Gothic Dress',
  'Cyber Jacket', 'Cyber Pants',
  'Sailor Uniform',
  'Maid Dress',
  'Casual Shirt', 'Casual Jeans',
];
// outfit
const N_OUTFIT_PER_USER_MIN = 1;
const N_OUTFIT_PER_USER_MAX = 5;
const N_ITEM_PER_OUTFIT_MIN = 1;
const N_ITEM_PER_OUTFIT_MAX = 4;
const OUTFIT_STYLES = [
  'Casual', 'Formal', 'Sporty', 'Gothic', 'Cyberpunk', 'Vintage', 'Bohemian'
];
const OUTFIT_DESCRIPTIONS = [
  'A stylish outfit perfect for any occasion. Includes a mix of casual and formal elements.',
  'Comfortable and trendy look for everyday wear. With a touch of elegance.',
  'An elegant ensemble for special events.',
  'A bold and edgy style for the fashion-forward. And a hint of rebellion.',
  'A classic look with a modern twist. And timeless appeal.',
  'A vibrant and colorful outfit to brighten your day.',
  'A chic and sophisticated style for the urban explorer. And a touch of mystery.'
];
// compatibility
const COMPATIBILITY_NOTES = [
  'Requires bone adjustment', 
  'May cause clipping with certain avatars', 
  'Optimized for VRChat', 
  'High polycount, may affect performance'
];

// Possible categories and statuses
const CATEGORIES = ['cloth', 'hair', 'accessory', 'texture', 'prop', 'gimmick', 'other'] as const;
const STATUSES = ['official', 'modified', 'unsupported'] as const;
const OUTFIT_STATES = ['private', 'public', 'unlisted'] as const;



// Helper functions
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomString = (length: number) => Math.random().toString(36).substring(2, 2 + length);
const getRandomElement = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomElements = <T>(arr: readonly T[], n: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

const generateSource = (name: string) => {
  const itemKey = name.replace(/\s+/g, '_').toLowerCase()
  return {
    platform: 'example.com',
    itemKey: itemKey,
    sourceKey: `example:${itemKey}`,
  };
};


// **  Main functions **


// DB connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Starting dummy data injection...');

  try {
    // 1. Create Users
    const createdUserIds: string[] = [];

    console.log(`Creating ${N_USER} users...`);

    for (let i = 0; i < N_USER; i++) {
      const uniqueSuffix = getRandomString(8);
      
      const [user] = await db.insert(schema.users).values({
        email: `usr_${uniqueSuffix}@example.com`,
        password: PASSWORD_HASH,
      }).returning();
      const [profile] = await db.insert(schema.profiles).values({
        userId: user.id,
        handle: `usr_${uniqueSuffix}`,
        displayName: `User ${uniqueSuffix}`,
        avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.id}`,
        bio: `Hi! My name is User ${uniqueSuffix}. Welcome to my vrc-closet!`,
      }).returning();

      createdUserIds.push(user.id);
    }

    // Loop through each new user to create their assets
    for (const userId of createdUserIds) {
      console.log(`  Generating assets for user ${userId}...`);

      // 2. Create Avatars 
      const avatarCount = getRandomInt(N_AVATAR_PER_USER_MIN, N_AVATAR_PER_USER_MAX);
      const userAvatars: { id: string, name: string }[] = [];
      const avatarNames = getRandomElements(AVATAR_NAMES, avatarCount);

      for (let i = 0; i < avatarCount; i++) {
        const name = avatarNames[i];
        const { platform, itemKey, sourceKey } = generateSource(name);
        
        const [avatar] = await db.insert(schema.avatars).values({
          userId,
          name: `${name}`,
          storeUrl: `https://${platform}/items/${itemKey}`,
          sourceKey: sourceKey,
          thumbnailUrl: `https://placehold.co/1024x1024?text=${name}`,
        }).returning();
        
        userAvatars.push(avatar);
      }

      // 3. Create Items 
      const itemCount = getRandomInt(N_ITEM_PER_USER_MIN, N_ITEM_PER_USER_MAX);
      const userItems: { id: string, name: string }[] = [];
      const itemNames = getRandomElements(ITEM_NAMES, itemCount);

      for (let i = 0; i < itemCount; i++) {
        const category = getRandomElement(CATEGORIES);
        const { platform, itemKey, sourceKey } = generateSource(itemNames[i]);
        
        const [item] = await db.insert(schema.items).values({
          userId,
          name: itemNames[i],
          category: category,
          storeUrl: `https://${platform}/items/${itemKey}`,
          sourceKey: sourceKey,
          thumbnailUrl: `https://placehold.co/1024x1024?text=${itemNames[i]}`,
        }).returning();

        userItems.push(item);
      }

      // 4. Create Compatibility Matrix
      // Create random compatibility records for user's avatars and items
      const compatibilityData = [];
      for (const avatar of userAvatars) {
        for (const item of userItems) {
          // 70% chance to have a compatibility record
          if (Math.random() > 0.3) {
            compatibilityData.push({
              userId,
              avatarId: avatar.id,
              itemId: item.id,
              status: getRandomElement(STATUSES),
              note: Math.random() > 0.7 ? getRandomElement(COMPATIBILITY_NOTES) : null,
            });
          }
        }
      }
      if (compatibilityData.length > 0) {
        await db.insert(schema.compatibility).values(compatibilityData);
      }

      // 5. Create Outfits
      const outfitCount = getRandomInt(N_OUTFIT_PER_USER_MIN, N_OUTFIT_PER_USER_MAX);
      for (let i = 0; i < outfitCount; i++) {
        const baseAvatar = getRandomElement(userAvatars);
        
        // Pick 1-4 random items
        const outfitItemCount = getRandomInt(N_ITEM_PER_OUTFIT_MIN, N_ITEM_PER_OUTFIT_MAX);
        const selectedItems = getRandomElements(userItems, outfitItemCount);

        // Create Outfit
        const [outfit] = await db.insert(schema.outfits).values({
          userId,
          avatarId: baseAvatar.id,
          name: `${baseAvatar.name} - ${getRandomElement(OUTFIT_STYLES)} Style`,
          description: getRandomElement(OUTFIT_DESCRIPTIONS),
          state: getRandomElement(OUTFIT_STATES),
          imageUrl: `https://placehold.co/1920x1080?text=Outfit`,
        }).returning();

        // Link Items to Outfit
        if (selectedItems.length > 0) {
          await db.insert(schema.outfitItems).values(
            selectedItems.map(item => ({
              outfitId: outfit.id,
              itemId: item.id,
            }))
          );
        }
      }
    }

    console.log('✅ Dummy data injection completed!');
    process.exit(0);

  } catch (e) {
    console.error('❌ Failed to inject dummy data:', e);
    process.exit(1);
  }
}

main();