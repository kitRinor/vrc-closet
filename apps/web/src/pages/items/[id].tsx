import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { PageLayout } from "@/components/pageLayout";
import { ImageUploader } from "@/components/imageUploader";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

// Type
import type { InferResponseType } from "hono/client";
type ItemDetail = InferResponseType<typeof api.items[':id']['$get'], 200>;

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 編集用State
  const [name, setName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        const res = await api.items[':id'].$get({ param: { id } });
        if (res.ok) {
          const data = await res.json();
          setItem(data);
          
          // 初期値をセット (スキーマに合わせて修正)
          setName(data.name);
          setStoreUrl(data.storeUrl || "");
          setThumbnailUrl(data.thumbnailUrl || undefined);
        } else {
          navigate("/avatars"); // 見つからない場合は一覧へ
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, navigate]);

  // 更新処理
  const handleUpdate = async () => {
    if (!id || !name) return;
    setIsSaving(true);
    try {
      const res = await api.items[':id'].$put({
        param: { id },
        json: { 
          name, 
          storeUrl: storeUrl,
          thumbnailUrl 
        }
      });

      if (res.ok) {
        toast.success("更新しました");
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

  // 削除処理
  const handleDelete = async () => {
    if (!id || !confirm("本当に削除しますか？関連するコーデなども影響を受ける可能性があります。")) return;
    
    try {
      const res = await api.items[':id'].$delete({ param: { id } });
      if (res.ok) {
        toast.success("削除しました");
        navigate("/items");
      } else {
        toast.error("削除できませんでした");
      }
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) return <PageLayout><div className="p-10">Loading...</div></PageLayout>;
  if (!item) return null;

  return (
    <PageLayout>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/items">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">アイテム詳細</h1>
        </div>
        <Button variant="destructive" onClick={handleDelete} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200">
          <Trash2 className="h-4 w-4 mr-2" /> {t('action.delete')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左カラム: 画像 */}
        <div className="md:col-span-1">
          <ImageUploader 
            category="item" 
            defaultUrl={thumbnailUrl} 
            onUploadSuccess={setThumbnailUrl} 
          />
        </div>

        {/* 右カラム: 編集フォーム */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('core.item.name')}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label>Store URL</Label>
                <div className="flex gap-2">
                  <Input value={storeUrl} onChange={e => setStoreUrl(e.target.value)} placeholder="https://booth.pm/..." />
                  {storeUrl && (
                    <a href={storeUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleUpdate} disabled={isSaving} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" /> {isSaving ? "保存中..." : t('action.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}