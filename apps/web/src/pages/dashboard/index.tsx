import { useState, useEffect, useMemo, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, EllipsisIcon, ShirtIcon, Grid3X3Icon, PlusIcon, ImageIcon, Box } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { useTranslation } from "react-i18next";
import type { Asset, Recipe } from "@/lib/api";
import { AssetAddDialog } from "@/components/features/asset/AssetAddDialog";
import { RecipeAddDialog } from "@/components/features/recipe/RecipeAddDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RecipeCardView } from "@/components/features/recipe/RecipeCardView";
import { AssetCardView } from "@/components/features/asset/AssetCardView";

const MAX_VISIBLE = 10;

export default function HomePage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    if (auth.user) {
      fetchAssets();
      fetchRecipes();
    }
  }, [auth.user]);

  // 一覧取得
  const fetchAssets = async () => {
    const res = await dashboardApi.assets.$get({
      query: { 
        limit: MAX_VISIBLE+1,
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setAssets(await res.json());
  };
  const fetchRecipes = async () => {
    const res = await dashboardApi.recipes.$get({
      query:{
        limit: MAX_VISIBLE+1,
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setRecipes(await res.json());
  };

  return (
    <PageLayout>
      <div className="gap-8 flex flex-col">

        {/* publicレシピ一覧 */}

        {/* --- 所持アバター --- */}
        <section>
          <MyAssetList
            t_mode="recipe"
            data={recipes}
            onClickTitle={() => navigate("recipes")}
            renderItem={(item) => (
              <RecipeCardView key={item.id} item={item} onClick={() => navigate(`recipes/${item.id}`)} />
            )}
            renderDialog={(open, setOpen) => (
              <RecipeAddDialog open={open} setOpen={setOpen} onSuccess={fetchRecipes} />
            )}
          />
        </section>
        {/* --- 所持アイテム --- */}
        <section>
          <MyAssetList
            t_mode="asset"
            data={assets}
            onClickTitle={() => navigate("assets")}
            renderItem={(item) => (
              <AssetCardView key={item.id} item={item} onClick={() => navigate(`assets/${item.id}`)} />
            )}
            renderDialog={(open, setOpen) => (
              <AssetAddDialog open={open} setOpen={setOpen} onSuccess={fetchRecipes} />
            )}
          />
        </section>
      </div>
    </PageLayout>
  );
}

const MyAssetList = <T extends Asset | Recipe>(props:{
  t_mode?: 'asset' | 'recipe'; 
  data: T[];
  maxVisible?: number
  onClickTitle?: () => void;
  renderItem: (item: T) => React.ReactNode;
  renderDialog?: (open: boolean, setOpen: (open: boolean) => void) => React.ReactNode;
}) => {

  const { t } = useTranslation();
  const [openDialog, setOpenDialog] = useState(false);

  const maxVisible = props.maxVisible ?? 10;

  const Icon = props.t_mode === 'recipe' ? ShirtIcon : UserIcon;
  const trans = {
    title: props.t_mode === 'recipe' ? t("dashboard.my_recipes") : t("dashboard.my_assets"),
    addDialogTitle: props.t_mode === 'recipe' ? t("dashboard.add_recipe_dialog_title") : t("dashboard.add_asset_dialog_title"),
    addDialogDescription: props.t_mode === 'recipe' ? t("dashboard.add_recipe_dialog_description") : t("dashboard.add_asset_dialog_description"),
    emptyMessage: props.t_mode === 'recipe' ? t("dashboard.my_recipes_empty") : t("dashboard.my_assets_empty"),

    nameField: props.t_mode === 'asset' ? t("core.data.asset.name") : t("core.data.recipe.name"),
    storeUrlField: props.t_mode === 'asset' ? t("core.data.asset.store_url") : t("core.data.recipe.store_url"),
    thumbnailUrlField: props.t_mode === 'asset' ? t("core.data.asset.image_url") : t("core.data.recipe.image_url"),
  }

  return (
    <Card className="hover:bg-vrclo1-50  transition-colors h-full border-2 border-transparent hover:border-vrclo1-200 ">
      <CardHeader className="pb-2 flex flex-row justify-between">
        <CardTitle onClick={props.onClickTitle} className="text-lg text-vrclo1-700 font-bold flex items-center gap-2 cursor-pointer">
          <Icon className="h-5 w-5" /> 
          {trans.title}
        </CardTitle>
        {props.renderDialog && (<>
          <Button onClick={() => setOpenDialog(true)}><PlusIcon className="h-4 w-4 mr-2" /> {t('core.action.add')}</Button>
          {props.renderDialog(openDialog, setOpenDialog)}
        </>)}

      </CardHeader>             

      {/* 横スクロール可能に */}
      <div className="flex gap-4 p-4 overflow-x-auto">
        {props.data.slice(0, maxVisible).map(props.renderItem)}
        
        {props.data.length === 0 && (
          <div className="col-span-full text-center py-10 text-vrclo1-500 bg-vrclo1-50 rounded-lg border border-dashed">
            {trans.emptyMessage}
          </div>
        )}
        {props.data.length > maxVisible && (
          <Card 
            key="more"
            className="min-w-[10%] w-[10%] md:min-w-[8%] md:w-[8%] lg:min-w-[6%] lg:w-[6%] overflow-hidden bg-transparent border-transparent shadow-none text-vrclo1-400 transition-colors"
          >
            <div className="aspect-[1/4] flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <EllipsisIcon className="h-12 w-12" />
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}