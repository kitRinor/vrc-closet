import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { schema } from '../src/db';
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// 2. DB接続
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// 開発用ダミーユーザーID (APIの const.ts と同じにする)
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  console.log('🌱 Seeding start...');

  try {
    // --- CleanUp ---
    // 子テーブルから先に消さないと外部キー制約エラーになります
    console.log('Cleaning up old data...');
    await db.delete(schema.outfitItems);
    await db.delete(schema.outfits);
    await db.delete(schema.compatibility);
    await db.delete(schema.items);
    await db.delete(schema.avatars);
    await db.delete(schema.profiles);
    await db.delete(schema.users);

    // --- 1. Users ---
    console.log('Creating Users and Profiles...');
    await db.insert(schema.users).values({
      id: TEMP_USER_ID, // 固定IDを指定
      email: 'email@example.com',
      password: '$2b$10$rD3ceRnqEGJ/JN4oT.aED.maXdQLoCuhg2K75BzOzNLXipNJmqX/u', // hash for "password"
    });
    await db.insert(schema.profiles).values({
      userId: TEMP_USER_ID,
      handle: 'vrclo', // @vrclo,
      displayName: 'VRClo',
      avatarUrl: 'https://github.com/kitRinor.png', // tmp 
      bio: 'This is a sample bio for VRClo. Welcome to my vrc-closet!',
    });

    // --- 2. Avatars ---
    console.log('Creating Avatars...');
    // UUIDはDBが自動生成するので、returning() で生成されたIDを受け取ります
    const insertedAvatars = await db.insert(schema.avatars).values([
      { userId: TEMP_USER_ID, name: 'シフォン (Chiffon)', storeUrl: 'https://booth.pm/ja/items/5354471', sourceKey: 'booth:5354471', thumbnailUrl: 'https://booth.pximg.net/61a3b2d7-b4b1-4f97-9e48-ffe959b26ae9/i/5354471/c42b543c-a334-4f18-bd26-a5cf23e2a61b_base_resized.jpg' },
      { userId: TEMP_USER_ID, name: 'ルルネ (Rurune)', storeUrl: 'https://booth.pm/ko/items/5957830', sourceKey: 'booth:5957830', thumbnailUrl: 'https://booth.pximg.net/96d1d589-6879-4d30-8891-a2c6b8d64186/i/5957830/a4e0ae5b-7797-448b-80b1-e852c861e080_base_resized.jpg' },
      { userId: TEMP_USER_ID, name: 'マヌカ (Manuka)', storeUrl: 'https://booth.pm/ja/items/5058077', sourceKey: 'booth:5058077', thumbnailUrl: 'https://booth.pximg.net/8a7426aa-ba62-4ef0-9e7d-2c8ea96e7c9b/i/5058077/a18424fe-a56e-411a-9c47-27c56909593c_base_resized.jpg' },
    ]).returning();

    const chfn = insertedAvatars[0];
    const rrne = insertedAvatars[1];
    const mnka = insertedAvatars[2];

    // --- 3. Items ---
    console.log('Creating Items...');
    const insertedItems = await db.insert(schema.items).values([
      { userId: TEMP_USER_ID, name: '第七特務機関ワルキューレ', category: 'cloth', storeUrl: 'https://booth.pm/ja/items/6714930', sourceKey: 'booth:6714930', thumbnailUrl: 'https://booth.pximg.net/87b70515-e32e-4a2e-bf41-317cf2c2177c/i/6714930/c8da1ada-b914-4378-af76-ef371298b479_base_resized.jpg' },
      { userId: TEMP_USER_ID, name: 'Prologue', category: 'cloth', storeUrl: 'https://booth.pm/ja/items/6866946', sourceKey: 'booth:6866946', thumbnailUrl: 'https://booth.pximg.net/1ed0371c-24df-42e4-9b32-f9d27bdba98f/i/6866946/3b73248d-6402-4ef6-aa93-ed000dc08fc5_base_resized.jpg' },
      { userId: TEMP_USER_ID, name: 'SAMEHOLIC', category: 'cloth', storeUrl: 'https://booth.pm/ja/items/6005714', sourceKey: 'booth:6005714', thumbnailUrl: 'https://booth.pximg.net/ba557560-1aa1-433d-8f43-3eea697b3cb6/i/6005714/b5c1d0e1-a0e9-48e1-a992-48d25767dcfd_base_resized.jpg' },
      { userId: TEMP_USER_ID, name: 'MYAパーカー', category: 'cloth', storeUrl: 'https://booth.pm/ja/items/5725322', sourceKey: 'booth:5725322', thumbnailUrl: 'https://booth.pximg.net/34d49f99-5c26-4a38-a9bc-9abbed277c12/i/5725322/a6792daf-8b7a-4104-bd54-f31d80f03e9f_base_resized.jpg' },
      { userId: TEMP_USER_ID, name: 'でびでびぱーかー', category: 'cloth', storeUrl: 'https://booth.pm/ja/items/6176948', sourceKey: 'booth:6176948', thumbnailUrl: 'https://booth.pximg.net/fd53bf2d-0e68-4240-a515-bc14bf94ec1c/i/6176948/e2571262-f505-43c7-84ec-d621f0f751ea_base_resized.jpg' },

      { userId: TEMP_USER_ID, name: 'Medium Short Wolf Hair', category: 'hair', storeUrl: 'https://booth.pm/ja/items/5518344', sourceKey: 'booth:5518344' },
      { userId: TEMP_USER_ID, name: 'Shark hair Pin', category: 'accessory', storeUrl: 'https://booth.pm/ja/items/3160017', sourceKey: 'booth:3160017' },
      { userId: TEMP_USER_ID, name: 'Shark Teeth Necklace', category: 'accessory', storeUrl: 'https://booth.pm/ja/items/4350655', sourceKey: 'booth:4350655' },
    ]).returning();

    const cloth_valkyrie = insertedItems[0];
    const cloth_prologue = insertedItems[1];
    const cloth_sameholic = insertedItems[2];
    const cloth_myahoodie = insertedItems[3];
    const cloth_debihoodie = insertedItems[4];
    const hair_wolfhair = insertedItems[5];
    const acc_sharkpin = insertedItems[6];
    const acc_sharkneck = insertedItems[7];

    // --- 4. Compatibility ---
    console.log('Creating Compatibilities...');
    await db.insert(schema.compatibility).values([
      { userId: TEMP_USER_ID, avatarId: chfn.id, itemId: cloth_prologue.id, status: 'official' },
      { userId: TEMP_USER_ID, avatarId: chfn.id, itemId: cloth_sameholic.id, status: 'official' },
      { userId: TEMP_USER_ID, avatarId: chfn.id, itemId: cloth_myahoodie.id, status: 'official' },

      { userId: TEMP_USER_ID, avatarId: rrne.id, itemId: cloth_prologue.id, status: 'official' },
      { userId: TEMP_USER_ID, avatarId: rrne.id, itemId: cloth_sameholic.id, status: 'official' },

      { userId: TEMP_USER_ID, avatarId: mnka.id, itemId: cloth_prologue.id, status: 'official' },
    ]);

    // --- 5. Outfits ---
    console.log('Creating Outfits and Outfit Items...');
    const outfits = [
      {
        avatarId: chfn.id, 
        name: 'Chiffon Shark!!',
        description: 'A cool shark-themed outfit for Chiffon featuring SAMEHOLIC. Perfect for beach vibes! 🦈🌊',
        imageUrl: cloth_sameholic.thumbnailUrl, // just reuse item thumbnail for demo
        state: 'public',
        itemIds: [
          cloth_sameholic.id,
          hair_wolfhair.id,
          acc_sharkpin.id,
          acc_sharkneck.id,
        ]
      },
      {
        avatarId: rrne.id, 
        name: 'Rurune Valkyrie',
        description: 'A majestic Valkyrie outfit for Rurune, combining elegance and strength. Perfect for heroic adventures! 🛡️✨',
        imageUrl: cloth_valkyrie.thumbnailUrl,
        state: 'public',
        itemIds: [
          cloth_valkyrie.id,
          hair_wolfhair.id,
        ]
      },
      {
        avatarId: mnka.id, 
        name: 'Manuka Prologue',
        description: 'A stylish and modern look for Manuka featuring the Prologue outfit. Ideal for casual outings and social events! 🎉👗',
        imageUrl: cloth_prologue.thumbnailUrl, 
        state: 'private',
        itemIds: [
          cloth_prologue.id,
        ]
      },
      {
        avatarId: chfn.id, 
        name: 'Chiffon Debidebi',
        description: 'A cute and comfy outfit for Chiffon featuring the DebiDebi Hoodie. Perfect for relaxed hangouts! 🐰💖',
        imageUrl: cloth_debihoodie.thumbnailUrl,
        state: 'unlisted',
        itemIds: [
          cloth_debihoodie.id,
        ]
      }
    ]
    for (const outfitData of outfits) {
      const [outfit] = await db.insert(schema.outfits).values({
        userId: TEMP_USER_ID,
        avatarId: outfitData.avatarId, 
        name: outfitData.name,
        description: outfitData.description,
        imageUrl: outfitData.imageUrl,
        state: outfitData.state as 'public' | 'private' | 'unlisted',
      }).returning();
      // Link outfit items
      await db.insert(schema.outfitItems).values(
        outfitData.itemIds.map(itemId => ({
          userId: TEMP_USER_ID,
          outfitId: outfit.id,
          itemId,
        }))
      );
    }



    // --- Completed!! ---

    console.log('✅ Seeding completed successfully! ');
    process.exit(0);

  } catch (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  }
}

main();