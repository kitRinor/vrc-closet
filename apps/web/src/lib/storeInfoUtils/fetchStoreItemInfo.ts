import { fetchBoothItem, isBoothURL } from "./booth";

export type StoreItemInfo = {
  url: string;
  name: string;
  creator: string;
  thumbnailUrls: {
    original: string;
    resized?: string;
  }[];
  price: number;
  description: string;
  storeUrl: string;
};

export async function fetchStoreItemInfo(storeUrl: string): Promise<StoreItemInfo | null> {
  if (isBoothURL(storeUrl)) {
    return fetchBoothItem(storeUrl);
  }
  return null;
}