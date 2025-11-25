import { api } from '@/lib/api';
import { StoreItemInfo } from './fetchStoreItemInfo';



// BOOTH APIの型定義 (必要な部分のみ)
type BoothApiResponse = {
  id: number;
  name: string;
  price: string; // "¥ 3,000" 形式
  description: string;
  url: string; // "https://komado.booth.pm/items/5354471"
  shop: {
    name: string;
    url: string;
    thumbnail_url: string;
  };
  images: {
    original: string;
    resized: string;
    caption: string | null;
  }[];
  category: {
    name: string;
  };
};

export const isBoothURL = (url: string): boolean => {
  //  https://[shopSubdomain].booth.pm/items/[itemId]
  // または https://booth.pm/[locale]/items/[itemId]
  return /^https:\/\/(?:[\w-]+\.)?booth\.pm\/(?:\w+\/)?items\/\d+/.test(url);
};

/**
 * BOOTHの隠しJSONエンドポイントから情報を取得する
 * HTMLパースを行わないため高速・軽量
 */
export const fetchBoothItem = async (inputUrl: string): Promise<StoreItemInfo | null> => {
  try {

    // 2. JSONエンドポイントのURLを構築
    const jsonUrl = inputUrl.endsWith('/') ? `${inputUrl.slice(0, -1)}.json` : `${inputUrl}.json`;

    // 3. Proxy API経由でJSONを取得
    const res = await api.proxy.$get({
      query: { url: jsonUrl }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch via proxy: ${res.status}`);
    }

    // Proxyはテキストを返すのでJSONパースする
    const data = await res.json() as BoothApiResponse;

    // 4. データを整形して返す
    return {
      url: data.url,
      name: data.name,
      creator: data.shop?.name || 'Unknown',
      // images[0] がメイン画像。original を使うか resized を使うかは用途次第ですが、
      thumbnailUrls: data.images?.map(img => ({ original: img.original, resized: img.resized })) || [],
      // "¥ 3,000" -> 3000 に変換
      price: parsePrice(data.price),
      description: data.description || '',
      storeUrl: data.url || inputUrl,
    };

  } catch (error) {
    console.error('BOOTH JSON API failed:', error);
    return null;
  }
};

// 価格文字列 ("¥ 3,000") を数値に変換するヘルパー
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // 数字以外を除去して変換
  const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}