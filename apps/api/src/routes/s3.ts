import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_BUCKET_NAME, S3_PUBLIC_URL, resolveS3Url } from '../lib/s3';
import { TEMP_USER_ID } from '../const';
import { requireAuth } from '../middleware/auth';

/**
 * /s3 Routes
 * upload S3 Presigned URLの発行など 
 */


// Validation Schema
const PresignedUrlSchema = z.object({
  // png/jpeg/webpのみ許可
  contentType: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/png'),
  fileExt: z.enum(['png', 'jpg', 'jpeg', 'webp']).default('png'),
  // フォルダ分け用の論理カテゴリ
  category: z.enum(['avatar', 'item', 'outfit', 'other']).default('other'),
});

const app = new Hono()
.use('/*', requireAuth) // 全ルートで認証必須

// POST /s3/presigned
.post(
  '/presigned',
  zValidator('json', PresignedUrlSchema),
  async (c) => {
    try {
      const { contentType, fileExt, category } = c.req.valid('json');
      
      // 1. Auth Check (TEMP_USER_IDを使用)
      const userId = TEMP_USER_ID; 

      // 2. determine S3 Key
      //  public/[userId]/[category]/[uuid].[ext]
      const fileName = `${uuidv4()}.${fileExt}`;
      const key = `public/${userId}/${category}/${fileName}`;

      // 3. S3 Command の作成
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key, // S3上の最終パス
        ContentType: contentType,
        // S3ではACLが非推奨なので、基本Public-Readの設定は不要だが、必要ならここで設定可能
        ACL: 'public-read',
      });

      // 4. Generate Presigned URL
      const expire_sec = 60; // default expires in 60 seconds
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expire_sec });

      // 5. Response
      console.log('presigned URL generated', {
        uploadUrl,
        filePath: key, 
        publicUrl: resolveS3Url(key),
      });
      return c.json({
        uploadUrl,
        filePath: key, 
        publicUrl: resolveS3Url(key),
      });

    } catch (e) {
      console.error('S3 Presigned URL generation failed:', e);
      return c.json({ error: 'Failed to generate upload URL' }, 500);
    }
  }
);

export default app;