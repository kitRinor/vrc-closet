import { hc, InferResponseType } from 'hono/client';
import type { AppType } from '@repo/api'; 

const apiUrl = import.meta.env.VITE_API_URL as string || 'http://localhost:8787';


const fetchFn = (...args: Parameters<typeof fetch>) => {
  const [input, reqInit] = args
  return fetch(input, {
    ...reqInit,
    credentials: 'include', // Cookieを含める
  });
};

// root Client
const client = hc<AppType>(apiUrl, {fetch: fetchFn});
// sub-clients
export const authApi = client.auth; // 認証関連
export const adminApi = client.admin; // 管理コンソール関連(/_admin)
export const dashboardApi = client.dashboard; // ダッシュボード関連(/dashboard)
export const publicApi = client.public; // 公開ページ関連(/*)

export type Asset = InferResponseType<typeof dashboardApi.assets[':id']['$get'], 200>; 
export type Recipe = InferResponseType<typeof dashboardApi.recipes[':id']['$get'], 200>;

export const assetCategories = ["avatar", "cloth", "hair", "accessory", "texture", "prop", "gimmick", "other"] as const;
export const recipeStates = ["private", "public", "unlisted"] as const;