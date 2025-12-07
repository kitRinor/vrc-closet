import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { authApi, dashboardApi } from "@/lib/api";
import { useS3Upload } from "@/hooks/useS3Upload";
import { ImageCandidateList, type CandidateImage } from "@/components/common/ImageCandidateList";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Box } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
import type { InferResponseType } from "hono/client";
import { useAuth } from "@/contexts/AuthContext";

type AssetsDetail = InferResponseType<typeof dashboardApi.assets[':id']['$get'], 200>;

interface RecipeAddDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: (newRecipeId: string) => void;
}

export function RecipeAddDialog({ open, setOpen, onSuccess }: RecipeAddDialogProps) {
  const { t } = useTranslation();
  const auth = useAuth();
  
  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseAssetId, setBaseAssetId] = useState<string>("no_selection");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assets, setAssets] = useState<AssetsDetail[]>([]);

  // Image States
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  // レシピにはスクレイピング機能がないため候補画像はアップロード分のみですが、
  // ImageCandidateListのIFに合わせるため空配列を用意
  const [candidateImages] = useState<CandidateImage[]>([]); 

  // Hooks
  const { uploadImage, isUploading } = useS3Upload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Assets on Open
  useEffect(() => {
    if (open) {
      const fetchAssets = async () => {
        setIsLoadingAssets(true);
        try {
          // アバターのみに絞り込む場合はAPI側でフィルタするか、クライアントでフィルタする
          // 今回は全アセットを取得して、アバターを優先表示する等のUI工夫も可能
          const res = await dashboardApi.assets.$get({
            query: { limit: 100 }
          });
          if (res.ok) {
            setAssets(await res.json());
          }
        } catch (e) {
          console.error(e);
          toast.error(t('core.message.error_occurred'));
        } finally {
          setIsLoadingAssets(false);
        }
      };
      fetchAssets();
    }
  }, [open]);

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // カテゴリは 'outfit' (レシピ用)
    const url = await uploadImage(file, "outfit");
    if (url) {
      setImageUrl(url);
      setUploadedImages(prev => [url, ...prev]);
    }
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!name) return;
    setIsSubmitting(true);
    try {
      const res = await dashboardApi.recipes.$post({
        json: {
          userId: auth.user!.id,
          name,
          description: description,
          // "no_selection" の場合は null を送る
          baseAssetId: (baseAssetId && baseAssetId !== "no_selection") ? baseAssetId : null,
          imageUrl: imageUrl,
          state: "private", // Default state
        }
      });

      if (res.ok) {
        const newRecipe = await res.json();
        toast.success(t('core.message.create_success'));
        onSuccess?.(newRecipe.id); // IDを返して遷移などに使う
        handleClose();
      } else {
        toast.error(t('core.message.error_occurred'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset states
    setTimeout(() => {
      setName("");
      setDescription("");
      setBaseAssetId("no_selection");
      setImageUrl(undefined);
      setUploadedImages([]);
    }, 500);
  };

  const allCandidates = [
    ...uploadedImages.map(url => ({ original: url, resized: url })),
    ...candidateImages,
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('dashboard.recipes.create.page_title')}</DialogTitle>
          <DialogDescription>{t('dashboard.recipes.create.page_description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          
          {/* 1. Base Asset Selection */}
          <div className="space-y-2">
            <Label>{t('dashboard.recipes.create.select_base_asset')}</Label>
            <Select 
              value={baseAssetId} 
              onValueChange={setBaseAssetId} 
              disabled={isLoadingAssets || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingAssets ? t('core.action.loading') : "Select Avatar"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_selection">
                  <span className="text-muted-foreground">なし (None)</span>
                </SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={asset.imageUrl || undefined} />
                        <AvatarFallback><Box className="h-3 w-3" /></AvatarFallback>
                      </Avatar>
                      <span>{asset.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">({asset.category})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Recipe Name */}
          <div className="space-y-2">
            <Label>{t('dashboard.recipes.create.recipe_name')} <span className="text-destructive">*</span></Label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Summer Festival Look"
              disabled={isSubmitting}
            />
          </div>

          {/* 3. Description */}
          <div className="space-y-2">
            <Label>{t('core.data.asset.description')}</Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="メモやコンセプトなどを入力..."
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* 4. Image Upload */}
          <div className="min-w-0 w-full">
            <ImageCandidateList
              currentUrl={imageUrl}
              originalDbUrl={null}
              candidates={allCandidates}
              onSelect={setImageUrl}
              onUploadFile={handleUploadFile}
              isUploading={isUploading}
              // レシピでは自動Fetch機能はないのでボタン非表示
              showFetchButton={false} 
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('core.action.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!name || isSubmitting || isUploading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('dashboard.recipes.create.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}