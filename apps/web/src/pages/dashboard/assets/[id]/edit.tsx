import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { fetchStoreItemInfo } from "@/lib/storeInfoUtils/fetchStoreItemInfo";
import { useS3Upload } from "@/hooks/useS3Upload";
import { ImageCandidateList } from "@/components/common/ImageCandidateList";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ExternalLink, Save, Sparkles, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Type
import type { InferResponseType } from "hono/client";
import { StoreItemInfo } from "@/lib/storeInfoUtils/fetchStoreItemInfo";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

type AssetDetail = InferResponseType<typeof dashboardApi.assets[':id']['$get'], 200>;

export default function EditAsset() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoading, setLoading] = useState(true);

  const [prevData, setPrevData] = useState<AssetDetail | null>(null);

  // 編集用State (初期値をpropsから設定)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [storeUrl, setStoreUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // Images from scraping
  const [candidateImages, setCandidateImages] = useState<{
    original: string;
    resized?: string;
  }[]>([]);

  // Images uploaded by user manually
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const [fetchedStoreInfo, setFetchedStoreInfo] = useState<StoreItemInfo | null>(null);

  // Hook
  const { uploadImage, isUploading } = useS3Upload();

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await dashboardApi.assets[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setPrevData(data);

        setName(data.name);
        setDescription(data.description || "");
        setCategory(data.category || "other");
        setStoreUrl(data.storeUrl || "");
        setImageUrl(data.imageUrl || undefined);
      } else {
        navigate("/dashboard/assets");
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
  
  // Auto-fill from Store URL
  const handleAutoFill = async () => {
    if (!storeUrl) return;
    
    setIsScraping(true);
    try {
      const info = await fetchStoreItemInfo(storeUrl);
      if (info) {
        setFetchedStoreInfo(info);
        setName(info.name);
        
        if (info.imageUrls && info.imageUrls.length > 0) {
            setImageUrl(info.imageUrls[0].original);
            setCandidateImages(info.imageUrls);
        }
        toast.success("Fetched item info successfully");
      } else {
        toast.error("Failed to fetch info. Check the URL.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while fetching info.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleApplyName = async () => {
    if (isScraping) return;

    if (fetchedStoreInfo) {
      setName(fetchedStoreInfo.name);
      toast.success("Applied name from fetched info");
      return;
    }

    if (!storeUrl) return;

    setIsScraping(true);
    try {
      const info = await fetchStoreItemInfo(storeUrl);
      if (info) {
        setFetchedStoreInfo(info);
        setName(info.name);
        
        if (info.imageUrls && info.imageUrls.length > 0) {
             setCandidateImages(info.imageUrls);
        }
        toast.success("Fetched and applied name");
      } else {
        toast.error("Failed to fetch info");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error fetching info");
    } finally {
      setIsScraping(false);
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadImage(file, "item");
    
    if (uploadedUrl) {
      setImageUrl(uploadedUrl);
      setUploadedImages((prev) => [uploadedUrl, ...prev]);
    }
    event.target.value = "";
  };

  const handleUpdate = async () => {
    if (!id || !name) return;
    setIsSaving(true);
    try {
      const res = await dashboardApi.assets[':id'].$put({
        param: { id },
        json: { 
          name, 
          storeUrl: storeUrl || null,
          imageUrl: imageUrl || null,
          description: description || null,
          category: category || null,
        }
      });

      if (res.ok) {
        toast.success("更新しました");
        navigate(-1);
      } else {
        toast.error("更新に失敗しました");
      }
    } catch (e) {
      console.error(e);
      toast.error("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("本当に削除しますか？関連するコーデからも削除されます。")) return;
    
    try {
      const res = await dashboardApi.assets[':id'].$delete({ param: { id } });
      if (res.ok) {
        toast.success("削除しました");
        navigate("/dashboard/assets");
      } else {
        toast.error("削除できませんでした");
      }
    } catch (e) {
        console.error(e);
    }
  };

  // Combine uploaded images and scraped candidates
  const allCandidates = [
    ...uploadedImages.map(url => ({ original: url, resized: url })),
    ...candidateImages.map(img => ({ original: img.original, resized: img.resized || img.original })),
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t("dashboard.assets.edit.page_title")}
        description={t("dashboard.assets.edit.page_description")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左カラム: 画像プレビュー */}
        <div className="md:col-span-1">
          <div className="aspect-square bg-vrclo1-100  relative overflow-hidden rounded-lg border border-vrclo1-200  flex items-center justify-center shadow-sm">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" />
            ) : (
              <div className="text-vrclo1-300 flex flex-col items-center gap-2">
                <span className="text-sm text-vrclo1-400 font-medium">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム: 編集フォーム */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.assets.edit.page_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label>{t('core.data.asset.store_url')}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                        value={storeUrl} 
                        onChange={e => setStoreUrl(e.target.value)} 
                        placeholder="https://booth.pm/..." 
                        disabled={isScraping}
                    />
                    {storeUrl && !isScraping && (
                        <a 
                            href={storeUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-vrclo1-400 hover:text-blue-500"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleAutoFill} 
                    disabled={!storeUrl || isScraping}
                    title={t('dashboard.assets.edit.auto_fill_tooltip')}
                    className="border border-vrclo1-300 hover:border-vrclo1-400  "
                  >
                    {isScraping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.assets.edit.store_url_help')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t('core.data.asset.name')}</Label>
                <div className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} disabled={isScraping} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleApplyName}
                    disabled={isScraping || (!fetchedStoreInfo && !storeUrl)}
                    title={t('dashboard.assets.edit.apply_name_tooltip')}
                  >
                    {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <ImageCandidateList
                currentUrl={imageUrl}
                originalDbUrl={prevData?.imageUrl}
                candidates={allCandidates}
                onSelect={setImageUrl}
                onUploadFile={handleUploadFile}
                isUploading={isUploading}
                onFetch={handleAutoFill}
                isFetching={isScraping}
                showFetchButton={!!(storeUrl && !fetchedStoreInfo)}
              />

              <div className="pt-6 flex items-center justify-between border-t mt-4">
                <Button variant="destructive" type="button" onClick={handleDelete} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200">
                  <Trash2 className="h-4 w-4 mr-2" /> {t('core.action.delete')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => navigate(-1)}>
                    {t('core.action.cancel')}
                  </Button>
                  <Button onClick={handleUpdate} disabled={isSaving || isScraping || isUploading}>
                    <Save className="h-4 w-4 mr-2" /> {isSaving ? t('core.action.loading') : t('core.action.save')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}