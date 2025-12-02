import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { publicApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Image as ImageIcon, User as UserIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/common/PageHeader";
type PublicOutfitDetail = InferResponseType<typeof publicApi.outfits[':id']['$get'], 200>;

export default function PublicOutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [outfit, setOutfit] = useState<PublicOutfitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchOutfit = async () => {
      try {
        const res = await publicApi.outfits[':id'].$get({ param: { id } });
        if (res.ok) {
          setOutfit(await res.json());
        } else {
          toast.error(t('core.message.fetch_failed'));
          navigate('..');
        }
      } catch (e) {
        console.error(e);
        toast.error(t('core.message.error_occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchOutfit();
  }, [id, navigate]);

  if (loading) return <PageLayout><div className="p-10 text-center">{t('core.action.loading')}</div></PageLayout>;
  if (!outfit) return null;

  return (
    <PageLayout>
      <PageHeader
        title={outfit.name}
      />
      <div className="max-w-5xl mx-auto p-4 md:p-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Main Image */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-border shadow-sm">
               <div className="aspect-video flex items-center justify-center relative">
                 {outfit.imageUrl ? (
                   <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-full object-contain" />
                 ) : (
                   <div className="text-muted-foreground flex flex-col items-center gap-2">
                     <ImageIcon className="h-16 w-16 opacity-50" />
                     <span>No Preview Image</span>
                   </div>
                 )}
               </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{outfit.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {outfit.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Details & Items */}
          <div className="space-y-6">
            
            {/* Creator Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t('outfits.creator')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={outfit.user.avatarUrl || undefined} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{outfit.user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{outfit.user.handle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Base Avatar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t('outfits.base_avatar')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-md">
                    <AvatarImage src={outfit.avatar?.imageUrl || undefined} className="object-cover" />
                    <AvatarFallback className="rounded-md"><UserIcon /></AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" title={outfit.avatar?.name}>{outfit.avatar?.name}</p>
                    <div className="flex justify-between items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground capitalize">Avatar</p>
                      {outfit.avatar?.storeUrl && (
                        <a 
                          href={outfit.avatar.storeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          Store <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Used Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t('outfits.items_used', { count: outfit.items.length })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {outfit.items.length > 0 ? (
                  outfit.items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start group">
                      <div className="h-12 w-12 bg-muted rounded-md flex-shrink-0 overflow-hidden border border-border">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={item.name}>{item.name}</p>
                        <div className="flex justify-between items-center gap-4 mt-1">
                          <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                          {item.storeUrl && (
                            <a 
                              href={item.storeUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                            >
                              Store <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('outfits.no_items')}</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}