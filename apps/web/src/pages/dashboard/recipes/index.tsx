import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Image as ImageIcon, Box } from "lucide-react"; // Changed UserIcon to Box for generic asset
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Type
import type { InferResponseType } from "hono/client";
import { RecipeAddDialog } from "@/components/features/recipe/RecipeAddDialog";

// Define response type from API
type RecipeDetail = InferResponseType<typeof dashboardApi.recipes[':id']['$get'], 200>;


export default function RecipesIndexPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  
  const fetchData = async () => {
    try {
      const res = await dashboardApi.recipes.$get({
          query: { limit: 20 }
      });
      if (res.ok) {
        setRecipes(await res.json());
      } else {
        toast.error(t('core.message.fetch_failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <PageLayout>
        <div className="p-10 text-center text-muted-foreground">
          {t('core.action.loading')}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t('dashboard.recipes.list.page_title')}
        description={t('dashboard.recipes.list.page_description')}
      >
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />{t('dashboard.recipes.list.add_recipe')}</Button>
        <RecipeAddDialog
          open={isDialogOpen}
          setOpen={setIsDialogOpen}
          onSuccess={fetchData}
        />
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <Link key={recipe.id} to={`${recipe.id}`}>
            <Card className="h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border-border">
              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                {recipe.imageUrl ? (
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                )}
                
                {/* State Badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant={recipe.state === 'public' ? 'default' : 'secondary'} className="shadow-sm">
                    {t(`dashboard.recipes.edit.status.${recipe.state}`)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate">{recipe.name}</h3>
                
                {/* Base Asset Info (Optional) */}
                {recipe.baseAsset ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={recipe.baseAsset.imageUrl || undefined} />
                            <AvatarFallback><Box className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                        <span className="truncate">{recipe.baseAsset.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 opacity-50">
                        <Box className="h-4 w-4" />
                        <span className="truncate">No Base Asset</span>
                    </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}

        {recipes.length === 0 && (
          <div className="col-span-full py-16 text-center bg-muted/30 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground mb-4">{t('dashboard.recipes.list.no_recipes')}</p>
            <Link to="create">
              <Button variant="outline">{t('dashboard.recipes.list.add_recipe')}</Button>
            </Link>
          </div>
        )}
      </div>
    </PageLayout>
  );
}