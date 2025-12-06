import { useState, useEffect, useMemo, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, EllipsisIcon, ShirtIcon, Grid3X3Icon, PlusIcon } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { useTranslation } from "react-i18next";
import type { Asset, Recipe } from "@/lib/api";
import { AssetAddDialog } from "@/components/features/asset/AssetAddDialog";

const MAX_VISIBLE = 10;

export default function HomePage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [openNewAvatar, setOpenNewAvatar] = useState(false);
  const [openNewItem, setOpenNewItem] = useState(false);

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
        {/* --- 所持アバター --- */}
        <section>
          <MyAssetList
            t_mode="recipe"
            data={recipes}
            isDialogOpen={openNewAvatar}
            setIsDialogOpen={setOpenNewAvatar}
            onClickTitle={() => navigate("recipes")}
            onClickItem={(item) => navigate(`recipes/${item.id}`)}
            onSuccess={fetchAssets}
          />
        </section>
        {/* --- 所持アイテム --- */}
        <section>
          <MyAssetList
            t_mode="asset"
            data={assets}
            isDialogOpen={openNewItem}
            setIsDialogOpen={setOpenNewItem}
            onClickTitle={() => navigate("assets")}
            onClickItem={(item) => navigate(`assets/${item.id}`)}
            onSuccess={fetchRecipes}
          />
        </section>
      </div>
    </PageLayout>
  );
}

const MyAssetList = <T extends Asset | Recipe>(props:{
  t_mode?: 'asset' | 'recipe'; 
  data: T[];
  isDialogOpen: boolean;
  maxVisible?: number
  setIsDialogOpen: (open: boolean) => void;
  onClickTitle: () => void;
  onClickItem: (item: T) => void;
  onSuccess?: () => void;
}) => {

  const { t } = useTranslation();

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
  const DialogComponent = useMemo(() => 
    props.t_mode === 'recipe' ? (..._: any[]) => null : AssetAddDialog,
  [props.t_mode]);

  return (
    <Card className="hover:bg-vrclo1-50  transition-colors h-full border-2 border-transparent hover:border-vrclo1-200 ">
      <CardHeader className="pb-2 flex flex-row justify-between">
        <CardTitle onClick={props.onClickTitle} className="text-lg text-vrclo1-700 font-bold flex items-center gap-2 cursor-pointer">
          <Icon className="h-5 w-5" /> 
          {trans.title}
        </CardTitle>

        <Button onClick={() => props.setIsDialogOpen(true)}><PlusIcon className="h-4 w-4 mr-2" /> {t('core.action.add')}</Button>
        <DialogComponent
          open={props.isDialogOpen} 
          setOpen={props.setIsDialogOpen} 
          onSuccess={props.onSuccess} 
        />

      </CardHeader>             

      {/* 横スクロール可能に */}
      <div className="flex gap-4 p-4 overflow-x-auto">
        {props.data.slice(0, maxVisible).map((item) => (
          <Card 
            key={item.id} onClick={() => props.onClickItem(item)} 
            className="min-w-[33%] w-[33%] md:min-w-[25%] md:w-[25%] lg:min-w-[20%] lg:w-[20%] hover:bg-vrclo1-50  transition-colors h-full border-2 border-transparent hover:border-vrclo1-200  overflow-hidden cursor-pointer"
          >
            <div className="aspect-square bg-vrclo1-100  flex items-center justify-center text-vrclo1-300">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
            </div>
            <CardFooter className="p-3 flex flex-col items-start">
              <span className="font-bold truncate w-full text-vrclo1-700">{item.name}</span>
            </CardFooter>
          </Card>
        ))}
        
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