import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Upload, RefreshCw, ImageOff } from "lucide-react";
import { Label } from "@/components/ui/label";

// 候補画像の型
export type CandidateImage = {
  original: string;
  resized?: string;
};

interface ImageCandidateListProps {
  currentUrl: string | undefined;
  originalDbUrl: string | null | undefined;
  candidates: CandidateImage[];
  onSelect: (url: string | undefined) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  onFetch?: () => void;
  isFetching?: boolean;
  showFetchButton?: boolean;
}

export function ImageCandidateList({
  currentUrl,
  originalDbUrl,
  candidates,
  onSelect,
  onUploadFile,
  isUploading,
  onFetch,
  isFetching = false,
  showFetchButton = false,
}: ImageCandidateListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表示する要素が何もない場合は何もレンダリングしない
  const hasContent = originalDbUrl || candidates.length > 0 || showFetchButton;
  if (!hasContent && !currentUrl) {
      // アップロードボタンだけは最低限表示したい場合はここを調整
      // 今回は「画像候補リスト」という体裁なので、リスト表示エリアとして常に表示しつつ、
      // アップロードボタンを含める形にします。
  }

  return (
    <div className="space-y-2 pt-4 border-t mt-4">
      <Label className="text-xs text-muted-foreground">画像候補</Label>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
        
        {/* 1. 元画像 (DB保存値) */}
        {originalDbUrl && (
          <button
            type="button"
            onClick={() => onSelect(originalDbUrl)}
            className={cn(
              "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
              currentUrl === originalDbUrl
                ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                : "border-transparent hover:border-zinc-300"
            )}
            title="元の画像"
          >
            <img
              src={originalDbUrl}
              alt="Original"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5">
              Original
            </span>
          </button>
        )}

        {/* 2. スクレイピング候補 */}
        {candidates.map((img, idx) => (
          <button
            key={`${img.original}-${idx}`}
            type="button"
            onClick={() => onSelect(img.original)}
            className={cn(
              "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
              currentUrl === img.original
                ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                : "border-transparent hover:border-zinc-300"
            )}
          >
            <img
              src={img.resized || img.original}
              alt={`Candidate ${idx + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}

        {/* 3. 選択解除 (None) */}
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className={cn(
            "h-16 w-16 flex-shrink-0 flex flex-col items-center justify-center rounded-md border-2 border-dashed transition-all",
            !currentUrl
              ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-500"
              : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          )}
          title="画像を削除"
        >
          <ImageOff className="h-5 w-5 mb-1 opacity-60" />
          <span className="text-[9px] opacity-60">None</span>
        </button>

        {/* 4. Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "h-16 w-16 flex-shrink-0 flex flex-col items-center justify-center rounded-md border-2 border-dashed transition-all bg-zinc-50 dark:bg-zinc-900",
            "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 text-zinc-500"
          )}
          title="画像をアップロード"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5 mb-1 opacity-60" />
          )}
          <span className="text-[9px] opacity-60">
            {isUploading ? "Uploading" : "Upload"}
          </span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={onUploadFile}
        />

        {/* 5. Fetch Button (Conditional) */}
        {showFetchButton && (
          <button
            type="button"
            onClick={onFetch}
            disabled={isFetching}
            className={cn(
              "h-16 w-16 flex-shrink-0 flex flex-col items-center justify-center rounded-md border-2 border-dashed transition-all",
              "border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20 text-blue-500"
            )}
            title="BOOTHから画像を取得"
          >
            {isFetching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 mb-1 opacity-60" />
            )}
            <span className="text-[9px] opacity-60">
              {isFetching ? "Loading" : "Fetch"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}