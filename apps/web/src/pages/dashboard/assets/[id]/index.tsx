import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Pencil, Image as ImageIcon, Layers, UserIcon } from "lucide-react";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/common/PageHeader";
type AssetDetail = InferResponseType<typeof dashboardApi.assets[':id']['$get'], 200>;

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [sharedRecipes, setSharedRecipes] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await dashboardApi.assets[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setAsset(data);
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

  if (loading) return <PageLayout><div className="p-10">{t("core.message.loading")}</div></PageLayout>;
  if (!asset) return null;

  return (
    <PageLayout>
      {/* ヘッダー */}
      <PageHeader
        title={t("dashboard.assets.detail.page_title")} 
        description={t("dashboard.assets.detail.page_description")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左カラム: 画像表示 */}
        <div className="md:col-span-1">
          <div className="aspect-square bg-vrclo1-100  relative overflow-hidden rounded-lg border border-vrclo1-200  flex items-center justify-center shadow-sm">
            {asset.imageUrl ? (
              <img src={asset.imageUrl} alt={asset.name} className="object-cover w-full h-full" />
            ) : (
              <div className="text-vrclo1-300 flex flex-col items-center gap-2">
                <ImageIcon className="h-16 w-16" />
                <span className="text-sm text-vrclo1-400 font-medium">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム: 情報表示 */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{asset.name}</span>
                <Button onClick={() => navigate(`edit`)} variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div>
                <h2 className="text-sm font-medium text-vrclo1-500 ">{t("core.data.asset.category")}</h2>
                <p className="text-base mt-1 capitalize">{asset.category}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-vrclo1-500 ">{t("core.data.asset.store_url")}</h2>
                {asset.storeUrl ? (
                  <a 
                    href={asset.storeUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline mt-1 break-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {asset.storeUrl}
                  </a>
                ) : (
                  <p className="text-sm text-vrclo1-400 mt-1">{t("core.message.no_data")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          
        </div>
      </div>
    </PageLayout>
  );
}