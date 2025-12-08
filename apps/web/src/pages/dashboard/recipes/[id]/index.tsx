import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Pencil, ArrowLeft, Image as ImageIcon, 
  User as UserIcon, Settings2, Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

// Type
import type { InferResponseType } from "hono/client";

type RecipeDetail = InferResponseType<typeof dashboardApi.recipes[':id']['$get'], 200>;

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Recipe
  useEffect(() => {
    if (!id) return;
    const fetchRecipe = async () => {
      try {
        const res = await dashboardApi.recipes[':id'].$get({ param: { id } });
        if (res.ok) {
          setRecipe(await res.json());
        } else {
          toast.error(t('core.message.fetch_failed'));
          navigate("/dashboard/recipes");
        }
      } catch (e) {
        console.error(e);
        toast.error(t('core.message.error_occurred'));
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, navigate, t]);

  const handleCopyConfig = (config: any) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success("Config copied!");
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-10 text-center text-muted-foreground">
          {t('core.action.loading')}
        </div>
      </PageLayout>
    );
  }

  if (!recipe) return null;

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title={recipe.name}
        description={recipe.description || ""}
      >
        <div className="flex items-center gap-2">
          {/* Back Button */}
          <Link to="/dashboard/recipes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('core.action.back')}
            </Button>
          </Link>
          
          {/* Edit Button */}
          <Link to="edit">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              {t('core.action.edit')}
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Left Column: Visual & Info --- */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <Card className="overflow-hidden border-none shadow-none bg-transparent">
             <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border relative shadow-sm">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={recipe.state === 'public' ? 'default' : 'secondary'}>
                    {t(`dashboard.recipes.edit.status.${recipe.state}`)}
                  </Badge>
                </div>
             </div>
          </Card>


          
          {/* Ingredients List */}
          <section>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              {t('dashboard.recipes.edit.ingredients')}
            </h2>

            <div className="space-y-4"> 
              {/* 2. Ingredients (Base Asset) */}
              {recipe?.baseAsset && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      {t('core.data.recipe.base_asset')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      {recipe?.baseAsset?.imageUrl && (
                        <div className="h-14 w-14 rounded-md overflow-hidden border border-border bg-muted flex-shrink-0">
                          <img src={recipe?.baseAsset?.imageUrl} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{recipe?.baseAsset?.name}</p>
                        <a 
                          href={recipe?.baseAsset?.storeUrl ?? '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          BOOTH <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {recipe.assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="flex flex-col">
                    {/* Asset Info */}
                    <div className="p-3 flex items-center gap-3 bg-muted/30 border-b border-border">
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border border-border">
                          <img src={asset.asset?.imageUrl || undefined} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{asset.asset?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{asset.asset?.category}</p>
                        </div>
                    </div>

                    {/* Config & Note */}
                    <div className="p-3 flex-1 text-xs space-y-2">
                      {asset.note && (
                        <div className="text-muted-foreground border-l-2 border-primary/20 pl-2 mb-2">
                          {asset.note}
                        </div>
                      )}
                      
                      {asset.configuration && Object.keys(asset.configuration).length > 0 && (
                        <div className="bg-muted/50 rounded p-2 font-mono flex items-start justify-between group">
                          <pre className="overflow-x-auto whitespace-pre-wrap break-all max-h-[100px]">
                            {Object.entries(asset.configuration).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            ))}
                          </pre>
                          <button 
                            onClick={() => handleCopyConfig(asset.configuration)}
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* --- Right Column: Steps & Ingredients --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Steps Timeline */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {t('dashboard.recipes.edit.steps')}
            </h2>
            
            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:h-full before:w-[2px] before:bg-border before:content-['']">
              {recipe.steps.length === 0 && (
                <p className="pl-10 text-muted-foreground text-sm">手順は登録されていません。</p>
              )}
              
              {recipe.steps.sort((a,b) => a.stepNumber - b.stepNumber).map((step) => (
                <div key={step.id} className="relative pl-10">
                  {/* Badge */}
                  <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-muted font-bold text-xs text-muted-foreground z-10">
                    {step.stepNumber}
                  </div>
                  
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-lg">{step.name}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                        {step.description}
                      </p>
                      {step.imageUrl && (
                        <div className="rounded-md overflow-hidden mt-2">
                          <img src={step.imageUrl} alt={step.name} className="max-h-[200px] object-cover" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </section>


        </div>
      </div>
    </PageLayout>
  );
}