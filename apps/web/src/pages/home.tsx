import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserIcon, EllipsisIcon, ShirtIcon, Grid3X3Icon, PlusIcon } from "lucide-react";
import { PageLayout } from "@/components/pageLayout";
import { useTranslation } from "react-i18next";
import type { Avatar, Item } from "@/lib/api";

const MAX_VISIBLE = 10;

export default function HomePage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [openNewAvatar, setOpenNewAvatar] = useState(false);
  const [openNewItem, setOpenNewItem] = useState(false);

  useEffect(() => {
    if (auth.user) {
      fetchAvatars();
      fetchItems();
    }
  }, [auth.user]);

  // 一覧取得
  const fetchAvatars = async () => {
    const res = await api.avatars.$get({
      query: { 
        limit: MAX_VISIBLE+1,
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setAvatars(await res.json());
  };
  const fetchItems = async () => {
    const res = await api.items.$get({
      query:{
        limit: '16',
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setItems(await res.json());
  };

  // 追加処理
  const handleAddAvatar = async (data: Partial<Avatar>) => {
    await api.avatars.$post({ json: data });
    setOpenNewAvatar(false);
    fetchAvatars(); 
  };
  const handleAddItem = async (data: Partial<Item>) => {
    await api.items.$post({ json: data });
    setOpenNewItem(false);
    fetchItems(); 
  };

  return (
    <PageLayout>
      <div className="gap-8 flex flex-col">
        {/* --- クイックアクセス --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/matrix">
            <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer h-full border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{t("home.matrix")}</CardTitle>
                <Grid3X3Icon className="h-5 w-5 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500">
                  {t("home.matrix_description")}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-blue-700 dark:text-blue-300">{t("home.community_outfit")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                {t("home.community_outfit_description")}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* --- 所持アバター --- */}
        <section>
          <MyAssetList<Avatar>
            t_mode="avatar"
            data={avatars}
            isDialogOpen={openNewAvatar}
            setIsDialogOpen={setOpenNewAvatar}
            onClickTitle={() => navigate("/avatars")}
            onClickItem={(item) => navigate(`/avatars/${item.id}`)}
            handleAdd={handleAddAvatar}
          />
        </section>
        {/* --- 所持アイテム --- */}
        <section>
          <MyAssetList<Item>
            t_mode="item"
            data={items}
            isDialogOpen={openNewItem}
            setIsDialogOpen={setOpenNewItem}
            onClickTitle={() => navigate("/items")}
            onClickItem={(item) => navigate(`/items/${item.id}`)}
            handleAdd={handleAddItem}
          />
        </section>
      </div>
    </PageLayout>
  );
}

const MyAssetList = <T extends Avatar | Item>(props:{
  t_mode?: 'avatar' | 'item'; 
  data: T[];
  isDialogOpen: boolean;
  maxVisible?: number
  setIsDialogOpen: (open: boolean) => void;
  onClickTitle: () => void;
  onClickItem: (item: T) => void;
  handleAdd: (item: Partial<T>) => void;
}) => {

  const { t } = useTranslation();
  const [newData, setNewData] = useState<Partial<T>>({});
  const maxVisible = props.maxVisible ?? 10;

  const Icon = props.t_mode === 'item' ? ShirtIcon : UserIcon;
  const trans = {
    title: props.t_mode === 'item' ? t("home.my_items") : t("home.my_avatars"),
    addDialogTitle: props.t_mode === 'item' ? t("home.add_item_dialog_title") : t("home.add_avatar_dialog_title"),
    addDialogDescription: props.t_mode === 'item' ? t("home.add_item_dialog_description") : t("home.add_avatar_dialog_description"),
    emptyMessage: props.t_mode === 'item' ? t("home.my_items_empty") : t("home.my_avatars_empty"),
  }

  return (
    <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors h-full border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
      <CardHeader className="pb-2 flex flex-row justify-between">
        <CardTitle onClick={props.onClickTitle} className="text-lg font-bold flex items-center gap-2 cursor-pointer">
          <Icon className="h-5 w-5" /> 
          {trans.title}
        </CardTitle>

        <Dialog open={props.isDialogOpen} onOpenChange={props.setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusIcon className="h-4 w-4 mr-1" /> {t("action.add")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{trans.addDialogTitle}</DialogTitle>
              <DialogDescription>
                {trans.addDialogDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t(`core._generic.name`)}</Label>
                <Input 
                  id="name" 
                  placeholder={t("action.input_placeholder", { field: t(`core._generic.name`) })} 
                  value={newData.name}
                  onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_url">{t(`core._generic.store_url`)}</Label>
                <Input 
                  id="store_url" 
                  placeholder={t("action.input_placeholder", { field: t(`core._generic.store_url`) })} 
                  value={newData.storeUrl ?? undefined}
                  onChange={(e) => setNewData({ ...newData, storeUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">{t(`core._generic.thumbnail_url`)}</Label>
                <Input 
                  id="thumbnail_url" 
                  placeholder={t("action.input_placeholder", { field: t(`core._generic.thumbnail_url`) })} 
                  value={newData.thumbnailUrl ?? undefined}
                  onChange={(e) => setNewData({ ...newData, thumbnailUrl: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => props.handleAdd(newData)}>{t("action.add")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardHeader>             

      {/* 横スクロール可能に */}
      <div className="flex gap-4 p-4 overflow-x-auto">
        {props.data.slice(0, maxVisible).map((item) => (
          <Card 
            key={item.id} onClick={() => props.onClickItem(item)} 
            className="min-w-[33%] w-[33%] md:min-w-[25%] md:w-[25%] lg:min-w-[20%] lg:w-[20%] hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors h-full border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 overflow-hidden transition-colors cursor-pointer"
            // className="w-1/5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors h-full border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 overflow-hidden transition-colors cursor-pointer"
          >
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
            </div>
            <CardFooter className="p-3 flex flex-col items-start">
              <span className="font-bold truncate w-full">{item.name}</span>
            </CardFooter>
          </Card>
        ))}
        
        {props.data.length === 0 && (
          <div className="col-span-full text-center py-10 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed">
            {trans.emptyMessage}
          </div>
        )}
        {props.data.length > maxVisible && (
          <Card 
            key="more"
            className="min-w-[10%] w-[10%] md:min-w-[8%] md:w-[8%] lg:min-w-[6%] lg:w-[6%] overflow-hidden bg-transparent border-transparent shadow-none text-zinc-400 transition-colors"
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