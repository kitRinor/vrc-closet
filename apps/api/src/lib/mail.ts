import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from 'dotenv';
config();
// ---------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------

const isProduction = process.env.NODE_ENV === 'production';

// Setup Nodemailer (For Local Development / Mailpit)
const smtpTransport = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 54325, // Supabase Mailpit
  secure: false,
});

// Setup Resend (For Production)
const resend = new Resend(process.env.RESEND_API_KEY || 're_123_dummy');

// ---------------------------------------------------------
// 2. Mail Sender Function
// ---------------------------------------------------------

type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * 環境に応じて送信方法を自動で切り替えるメール送信関数
 */
export const sendEmail = async (option: SendMailOptions) => {
  const { to, subject, text, html } = option;
  try {
    if (isProduction) {
      // Production: Use Resend (HTTP API)
      const { data, error } = await resend.emails.send({
        from: 'VRClo <no-reply@example.com>', // [Resendの送信元認証済みメールアドレスを指定]
        to,
        subject,
        text,
        html,
      });

      if (error) {
        console.error('Resend Error:', error);
        throw new Error('Failed to send email via Resend');
      }
      console.log(`📧 [Prod] Email sent via Resend: ${data?.id}`);

    } else {
      console.log('⚠️ Development mode: Sending email via Nodemailer (Mailpit)');
      // Local: Use Nodemailer (SMTP -> Mailpit)
      const info = await smtpTransport.sendMail({
        from: '"VRClo Dev" <no-reply@example.com>',
        to,
        subject,
        text,
        html,
      });
      console.log(`📧 [Dev] Email sent to Mailpit: ${info.messageId}`);
    }

  } catch (e) {
    console.error('Email sending failed:', e);
    // エラーを握りつぶすか、throwするかは要件次第
    // ここではユーザーに500を返すためにthrowする
    throw e;
  }
};