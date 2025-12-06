import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { schema } from '../src/db';
import { NewRecipe, NewRecipeAsset, NewRecipeStep } from '../src/db/schema/recipes';
import { NewAsset } from '../src/db/schema/assets';
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
    await db.delete(schema.recipeSteps);
    await db.delete(schema.recipeAssets);
    await db.delete(schema.recipes);
    await db.delete(schema.assets);
    await db.delete(schema.verificationCodes);
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

    // --- 2. Assets ---
    console.log('Creating Assets...');
    const assetsToInsert: Omit<NewAsset, 'id' | 'userId'>[] = [
      // Avatars
      {category: 'avatar', name: 'シフォン (Chiffon)', storeUrl: 'https://booth.pm/ja/items/5354471', sourceKey: 'booth:5354471', imageUrl: 'https://booth.pximg.net/61a3b2d7-b4b1-4f97-9e48-ffe959b26ae9/i/5354471/c42b543c-a334-4f18-bd26-a5cf23e2a61b_base_resized.jpg' },
      {category: 'avatar', name: 'ルルネ (Rurune)', storeUrl: 'https://booth.pm/ko/items/5957830', sourceKey: 'booth:5957830', imageUrl: 'https://booth.pximg.net/96d1d589-6879-4d30-8891-a2c6b8d64186/i/5957830/a4e0ae5b-7797-448b-80b1-e852c861e080_base_resized.jpg' },
      {category: 'avatar', name: 'マヌカ (Manuka)', storeUrl: 'https://booth.pm/ja/items/5058077', sourceKey: 'booth:5058077', imageUrl: 'https://booth.pximg.net/8a7426aa-ba62-4ef0-9e7d-2c8ea96e7c9b/i/5058077/a18424fe-a56e-411a-9c47-27c56909593c_base_resized.jpg' },
      // Clothes
      {category: 'cloth', name: '第七特務機関ワルキューレ', storeUrl: 'https://booth.pm/ja/items/6714930', sourceKey: 'booth:6714930', imageUrl: 'https://booth.pximg.net/87b70515-e32e-4a2e-bf41-317cf2c2177c/i/6714930/c8da1ada-b914-4378-af76-ef371298b479_base_resized.jpg' },
      {category: 'cloth', name: 'Prologue', storeUrl: 'https://booth.pm/ja/items/6866946', sourceKey: 'booth:6866946', imageUrl: 'https://booth.pximg.net/1ed0371c-24df-42e4-9b32-f9d27bdba98f/i/6866946/3b73248d-6402-4ef6-aa93-ed000dc08fc5_base_resized.jpg' },
      {category: 'cloth', name: 'SAMEHOLIC', storeUrl: 'https://booth.pm/ja/items/6005714', sourceKey: 'booth:6005714', imageUrl: 'https://booth.pximg.net/ba557560-1aa1-433d-8f43-3eea697b3cb6/i/6005714/b5c1d0e1-a0e9-48e1-a992-48d25767dcfd_base_resized.jpg' },
      {category: 'cloth', name: 'MYAパーカー', storeUrl: 'https://booth.pm/ja/items/5725322', sourceKey: 'booth:5725322', imageUrl: 'https://booth.pximg.net/34d49f99-5c26-4a38-a9bc-9abbed277c12/i/5725322/a6792daf-8b7a-4104-bd54-f31d80f03e9f_base_resized.jpg' },
      {category: 'cloth', name: 'でびでびぱーかー', storeUrl: 'https://booth.pm/ja/items/6176948', sourceKey: 'booth:6176948', imageUrl: 'https://booth.pximg.net/fd53bf2d-0e68-4240-a515-bc14bf94ec1c/i/6176948/e2571262-f505-43c7-84ec-d621f0f751ea_base_resized.jpg' },
      // hair
      {category: 'hair', name: 'Custom Base Chiffon Hair' },
      {category: 'hair', name: 'Medium Short Wolf Hair', storeUrl: 'https://booth.pm/ja/items/5518344', sourceKey: 'booth:5518344' },
      // accessories
      {category: 'accessory', name: 'Shark hair Pin', storeUrl: 'https://booth.pm/ja/items/3160017', sourceKey: 'booth:3160017' },
      {category: 'accessory', name: 'Shark Teeth Necklace', storeUrl: 'https://booth.pm/ja/items/4350655', sourceKey: 'booth:4350655' },
    ]
    // UUIDはDBが自動生成するので、returning() で生成されたIDを受け取ります
    const insertedAssets = await db.insert(schema.assets).values(
      assetsToInsert.map((asset) => ({
        ...asset,
        userId: TEMP_USER_ID,
      }))
    ).returning();

    // --- 3. Recipes ---
    console.log('Creating Recipes...');
    const recipesToInsert: {
      recipe: Omit<NewRecipe, 'id' | 'userId'>,
      steps: Omit<NewRecipeStep, 'id' | 'recipeId'>[],
      assets: Omit<NewRecipeAsset, 'id' | 'recipeId'>[],
    }[] = [
      {
        recipe: {
          name: 'ベースシフォン',
          description: 'シフォンの改変ベース用にカスタム手順',
          imageUrl: 'https://placehold.co/600x400?text=Base+Chiffon',
        },
        steps: [
          { stepNumber: 1, name: 'インポート', description: 'BoothからシフォンをダウンロードしてUnityにインポートする。', imageUrl: 'https://placehold.co/600x400?text=Step+1' },
          { stepNumber: 2, name: '髪型，髪色変更', description: '髪型を変更し、髪色を調整する。', imageUrl: 'https://placehold.co/600x400?text=Step+2' },
          { stepNumber: 3, name: 'シェイプキー調整', description: 'シェイプキーを利用して表情，体形を調整.\n\n 設定値は，\nbody:\n\teye_lid_x:100\n\teye_pupil_heart:100\n\teye_hl_B_none:100\nbody_base:\n\tbreast_small:75\n', imageUrl: 'https://placehold.co/600x400?text=Step+3' },
          { stepNumber: 4, name: 'prefab化&エクスポート(option)', description: '複数使いまわすならPrefab化, unitypackageにexportをしておくと楽', imageUrl: 'https://placehold.co/600x400?text=Step+4' },
          { stepNumber: 5, name: 'VRChatアップロード', description: 'VRChat SDKを使ってアップロードする。', imageUrl: 'https://placehold.co/600x400?text=Step+5' },
        ],
        assets: [
          { assetId: insertedAssets[0].id, note: 'ベースアバターとして使用' },
          { assetId: insertedAssets[8].id, note: '髪型として使用(自作)' },
        ],
      },
      {
        recipe: {
          name: 'ルルネカスタム',
          description: 'ルルネのカスタム手順',
          imageUrl: 'https://placehold.co/600x400?text=Rurune+Custom',
        },
        steps: [
          { stepNumber: 1, name: 'インポート', description: 'BoothからルルネをダウンロードしてUnityにインポートする。', imageUrl: 'https://placehold.co/600x400?text=Step+1' },
          { stepNumber: 2, name: 'シェイプキー調整', description: 'シェイプキーを利用して表情，体形を調整.\n\n 設定値は，\nbody:\n\teye_lid_x:100\n\teye_pupil_heart:100\n\teye_hl_B_none:100\nbody_base:\n\tbreast_small:75\n', imageUrl: 'https://placehold.co/600x400?text=Step+2' },
          { stepNumber: 3, name: 'アクセサリ追加', description: 'サメの髪飾りとネックレスを追加する。', imageUrl: 'https://placehold.co/600x400?text=Step+3' },
          { stepNumber: 4, name: 'prefab化&エクスポート(option)', description: '複数使いまわすならPrefab化, unitypackageにexportをしておくと楽', imageUrl: 'https://placehold.co/600x400?text=Step+4' },
          { stepNumber: 5, name: 'VRChatアップロード', description: 'VRChat SDKを使ってアップロードする。', imageUrl: 'https://placehold.co/600x400?text=Step+5' },
        ],
        assets: [
          { assetId: insertedAssets[1].id, note: 'ベースアバターとして使用' },
          { assetId: insertedAssets[9].id, note: '髪型として使用' },
          { assetId: insertedAssets[10].id, note: 'アクセサリとして使用' },
          { assetId: insertedAssets[11].id, note: 'アクセサリとして使用' },
        ],
      },
    ]
    for (const recipeData of recipesToInsert) {
      const insertedRecipes = await db.insert(schema.recipes).values({
        ...recipeData.recipe,
        userId: TEMP_USER_ID,
      }).returning();
      const recipeId = insertedRecipes[0].id;
      // Insert Steps
      await db.insert(schema.recipeSteps).values(
        recipeData.steps.map((step) => ({
          ...step,
          recipeId: recipeId,
        }))
      );
      // Insert Assets
      await db.insert(schema.recipeAssets).values(
        recipeData.assets.map((asset) => ({
          ...asset,
          recipeId: recipeId,
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