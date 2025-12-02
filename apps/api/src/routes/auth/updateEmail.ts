import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gt } from 'drizzle-orm';
import { requireAuth } from '@/middleware/auth';
import { sendEmail } from '@/lib/mail';
import { AppEnv } from '@/type';
import { users } from '@/db/schema/users';
import { db } from '@/db';
import { verificationCodes } from '@/db/schema/verificationCodes';

// 6-digit random code generator
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const updateEmail = new Hono<AppEnv>()
  .use(requireAuth)
  // 1. Request Verification Code (OTP Only)
  .post(
    '/request',
    zValidator('json', z.object({ email: z.string().email() })),
    async (c) => {
      const userId = c.get('userId')!;
      const { email } = c.req.valid('json');

      // Check existing email
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) return c.json({ error: 'Email already in use' }, 409);

      // Generate Code
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Optional: Clean up old codes for this user/type
      await db.delete(verificationCodes).where(and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.type, 'email_change')
      ));

      // Save OTP
      await db.insert(verificationCodes).values({
        userId,
        type: 'email_change',
        target: email,
        code,
        expiresAt,
      });

      // Send Email with Code
      await sendEmail({
        to: email,
        subject: '【VRClo】Verification Code for Email Change',
        text: `Your verification code is: ${code}\nIt expires in 15 minutes.`,
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`,
      });

      return c.json({ success: true, message: 'Verification code sent' });
    }
  )
  
  // 2. Verify Code & Update Email
  .post(
    '/confirm',
    zValidator('json', z.object({ code: z.string().length(6) })),
    async (c) => {
      const userId = c.get('userId')!;
      const { code } = c.req.valid('json');

      // Find valid code
      const validRecord = await db.query.verificationCodes.findFirst({
        where: and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, 'email_change'),
          gt(verificationCodes.expiresAt, new Date()) // Not expired
        ),
        orderBy: (t, { desc }) => desc(t.createdAt),
      });

      if (!validRecord) {
        return c.json({ error: 'Invalid or expired code' }, 400);
      }

      // Update User Email
      await db.update(users)
        .set({ email: validRecord.target})
        .where(eq(users.id, userId));

      // Delete used code
      await db.delete(verificationCodes).where(eq(verificationCodes.id, validRecord.id));

      return c.json({ success: true });
    }
  );

export default updateEmail;