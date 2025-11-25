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

export const api = hc<AppType>(apiUrl, {fetch: fetchFn});

export type Avatar = InferResponseType<typeof api.avatars[':id']['$get'], 200>; 
export type Item = InferResponseType<typeof api.items[':id']['$get'], 200>;
export type Outfit = InferResponseType<typeof api.outfits[':id']['$get'], 200>;