import { Hono } from 'hono';
import { AppEnv } from '@/type';

import get from './get';

export interface PublicProfileRes {
  userId: string;
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  // bannerUrl?: string;
  // websiteUrl?: string;
  // twitterHandle?: string;
  // discordHandle?: string;
}

const app = new Hono<AppEnv>()
  .route('/', get)

export default app;