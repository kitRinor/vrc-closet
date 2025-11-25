import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { PageLayout } from "@/components/pageLayout";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Pencil, Image as ImageIcon, Layers } from "lucide-react";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/pageHeader";
type ItemDetail = InferResponseType<typeof api.items[':id']['$get'], 200>;

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await api.items[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setItem(data);
      } else {
        navigate("/404", { replace: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  if (loading) return <PageLayout><div className="p-10">{t("core.action.loading")}</div></PageLayout>;
  if (!item) return null;

  return (
    <PageLayout>
      {/* ヘッダー */}
      <PageHeader
        title={t("items.detail.page_title")} 
        description={t("items.detail.page_description")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左カラム: 画像表示 */}
        <div className="md:col-span-1">
          <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={item.name} className="object-cover w-full h-full" />
            ) : (
              <div className="text-zinc-300 flex flex-col items-center gap-2">
                <ImageIcon className="h-16 w-16" />
                <span className="text-sm text-zinc-400 font-medium">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム: 情報表示 */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{item.name}</span>
                <Button onClick={() => navigate(`/items/${item.id}/edit`)} variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("core.data.item.category")}</h2>
                <p className="text-base mt-1 capitalize">{item.category}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("core.data.item.store_url")}</h2>
                {item.storeUrl ? (
                  <a 
                    href={item.storeUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline mt-1 break-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {item.storeUrl}
                  </a>
                ) : (
                  <p className="text-sm text-zinc-400 mt-1">{t("core.action.no_data")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 将来的な機能のプレースホルダー */}
          <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-500">
                <Layers className="h-5 w-5" />
                {t("items.detail.used_in_coordinations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                {t("core.action.no_data")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}