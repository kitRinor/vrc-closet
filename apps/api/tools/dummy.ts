import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { schema } from '../src/db';

// Load environment variables
config({ path: '../../.env' });

// ---------------------------------------------------------
// Configuration Constants
// ---------------------------------------------------------

const N_USER = 5; // Number of users to generate
const PASSWORD_HASH = '$2b$10$zqzRLPCJqd.f.7masmO1UetcMuDug7urSBADKgHkzP5IQaJkO.5vy'; // Hash for "password"

// Assets Configuration
const N_ASSET_PER_USER_MIN = 5;
const N_ASSET_PER_USER_MAX = 12;

const AVATAR_NAMES = [
  'Chiffon', 'Chocolat', 'Lime', 'Rusk', 
  'Manuka', 'Rurune', 'Selestia', 'Maya', 'Moe', 'Kikyo', 'Grus'
];

const ITEM_NAMES = [
  'Summer Dress', 'Summer Bikini', 'Winter Coat', 'Gothic Dress',
  'Cyber Jacket', 'Cyber Pants', 'Sailor Uniform', 'Maid Dress',
  'Casual Shirt', 'Casual Jeans', 'Techwear Set', 'Bunny Suit',
  'Cat Ears', 'Halo', 'Wings', 'Glasses', 'Mask',
  'Long Hair', 'Short Bob', 'Twin Tails', 'Ponytail'
];

const ASSET_CATEGORIES = ['avatar', 'cloth', 'hair', 'accessory', 'texture', 'prop', 'gimmick', 'other'] as const;

// Recipes Configuration
const N_RECIPE_PER_USER_MIN = 1;
const N_RECIPE_PER_USER_MAX = 4;

const RECIPE_TITLES = [
  'Summer Vibe', 'Winter Cozy', 'Cyberpunk Style', 'Gothic Lolita', 
  'Casual Daily', 'Sleepwear', 'Combat Ready', 'Party Look'
];

const RECIPE_DESCRIPTIONS = [
  'A cute setup for summer events.',
  'Warm and cozy outfit for winter.',
  'Cool cyber style with glowing textures.',
  'Classic gothic look.',
  'Simple and comfortable for daily use.',
  'Optimized for heavy instances.'
];

const RECIPE_STATES = ['private', 'public', 'unlisted'] as const;


// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

const getRandomInt = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomString = (length: number) => 
  Math.random().toString(36).substring(2, 2 + length);
const getRandomElement = <T>(arr: readonly T[]): T => 
  arr[Math.floor(Math.random() * arr.length)];
const getRandomElements = <T>(arr: readonly T[], n: number): T[] => 
  [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const generateRandomString = (length: number) => 
  Math.random().toString(36).substring(2, 2 + length);
const getAvatarUrl = (seed: string) => 
  `https://api.dicebear.com/9.x/thumb/svg?seed=${seed}`;
const getImageUrl = (text: string) => 
  `https://placehold.co/600x400?text=${text}`;
const generateSource = (key: string) => {
  const itemKey = key.replace(/\s+/g, '_').toLowerCase()
  return {
    platform: 'example.com',
    itemKey: itemKey,
    sourceKey: `example:${itemKey}`,
  };
};


// ---------------------------------------------------------
// Main Script
// ---------------------------------------------------------

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Starting dummy data injection (Append Mode)...');

  try {
    const createdUserIds: string[] = [];

    // 1. Create Users & Profiles
    console.log(`Creating ${N_USER} users...`);

    for (let i = 0; i < N_USER; i++) {
      const uniqueSuffix = generateRandomString(10);
      
      const [user] = await db.insert(schema.users).values({
        email: `user_${uniqueSuffix}@example.com`,
        password: PASSWORD_HASH,
      }).returning();

      await db.insert(schema.profiles).values({
        userId: user.id,
        handle: uniqueSuffix,
        displayName: `User ${uniqueSuffix}`,
        avatarUrl: getAvatarUrl(user.id),
        bio: `Hello! I am a dummy user generated at ${new Date().toISOString()}.`,
      });

      createdUserIds.push(user.id);
    }

    // 2. Generate Assets & Recipes for each user
    for (const userId of createdUserIds) {
      // 2-1. Generate Assets
      const assetCount = getRandomInt(N_ASSET_PER_USER_MIN, N_ASSET_PER_USER_MAX);
      const userAssets: { id: string, category: string, name: string }[] = [];

      // Ensure at least one avatar is created for recipes
      const ensureAvatar = true; 
      const sourceKeysSet = new Set<string>();
      for (let j = 0; j < assetCount; j++) {
        let category = ensureAvatar && j === 0 
          ? 'avatar' : getRandomElement(ASSET_CATEGORIES);
        let name = category === 'avatar' 
          ? getRandomElement(AVATAR_NAMES) : getRandomElement(ITEM_NAMES);
        const source = generateSource(`${category}@${name}`);
        if (sourceKeysSet.has(source.sourceKey)) {
          j--; // Retry if duplicate
          continue;
        }
        sourceKeysSet.add(source.sourceKey);

        const [asset] = await db.insert(schema.assets).values({
          userId,
          name: `${name} ${generateRandomString(3).toUpperCase()}`,
          category: category,
          storeUrl: `https://${source.platform}/items/${source.itemKey}`,
          sourceKey: source.sourceKey,
          imageUrl: getImageUrl(`${name}`),
          createdAt: new Date(),
        }).returning();

        userAssets.push(asset);
      }

      // Filter assets for recipe generation
      const myAvatars = userAssets.filter(a => a.category === 'avatar');
      const myItems = userAssets.filter(a => a.category !== 'avatar');

      if (myAvatars.length === 0) continue; // Skip recipe generation if no avatar

      // 2-2. Generate Recipes
      const recipeCount = getRandomInt(N_RECIPE_PER_USER_MIN, N_RECIPE_PER_USER_MAX);

      for (let k = 0; k < recipeCount; k++) {
        const baseAvatar = getRandomElement(myAvatars);
        const title = getRandomElement(RECIPE_TITLES);

        // Create Recipe
        const [recipe] = await db.insert(schema.recipes).values({
          userId,
          baseAssetId: baseAvatar.id,
          name: `${baseAvatar.name} - ${title}`,
          description: getRandomElement(RECIPE_DESCRIPTIONS),
          imageUrl: getImageUrl(`${baseAvatar.name} - ${title}`), // Use avatar image style for recipe thumb
          state: getRandomElement(RECIPE_STATES),
          createdAt: new Date(),
        }).returning();

        // Add Recipe Assets (Ingredients)
        // Pick 1-5 random items to attach
        const ingredients = getRandomElements(myItems, getRandomInt(1, 5));
        
        if (ingredients.length > 0) {
          await db.insert(schema.recipeAssets).values(
            ingredients.map(item => ({
              recipeId: recipe.id,
              assetId: item.id,
              note: 'Auto generated note.',
              // Dummy configuration JSON
              configuration: { 
                scale: 1.0, 
                parentBone: "Hips", 
                tool: "ModularAvatar" 
              },
            }))
          );
        }

        // Add Recipe Steps
        const stepCount = getRandomInt(2, 5);
        for (let s = 1; s <= stepCount; s++) {
          await db.insert(schema.recipeSteps).values({
            recipeId: recipe.id,
            stepNumber: s,
            name: `Step ${s}`,
            description: `This is the instruction for step ${s}. Configure the components carefully.`,
            imageUrl: getImageUrl(`Step ${s}`),
          });
        }
      }
    }

    console.log(`✅ Successfully injected ${N_USER} users and their data!`);
    process.exit(0);

  } catch (e) {
    console.error('❌ Failed to inject dummy data:', e);
    process.exit(1);
  }
}

main();