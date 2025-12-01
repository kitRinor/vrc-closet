import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

// UI
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, Image as ImageIcon, Search, Pencil, Eye, Check, AlertCircle, X, ArrowUpDown, ArrowUp, ArrowDown, ListFilter } from "lucide-react";

// Utils
import { cn } from "@/lib/utils";

// Type
import type { InferResponseType } from "hono/client";

type MatrixResponse = InferResponseType<typeof dashboardApi.matrix.$get, 200>;

// Status priority for sorting
const STATUS_WEIGHT = {
  official: 3,
  modified: 2,
  unsupported: 1,
  undefined: 0,
};

export default function MatrixPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState<MatrixResponse | null>(null);
  const prevData = useRef<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");

  // 🛠️ Sort State
  const [sortConfig, setSortConfig] = useState<{
    type: "avatar" | "item";
    itmKey: string; // "name" | "category"
    avtKey: string; // avatarId 
    direction: "desc" | "asc"; 
  }>({ type: "item", itmKey: "name", avtKey: "", direction: "asc" });

  // Fetch matrix data on load
  const fetchMatrix = async () => {
    try {
      const res = await dashboardApi.matrix.$get();
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error(t('dashboard.matrix.fetch_failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatrix();
    }
  }, [user]);

  // 🔍 Filtering Logic
  const filteredAvatars = useMemo(() => {
    if (!data) return [];
    return data.avatars.filter(a => 
      a.name.toLowerCase().includes(avatarFilter.toLowerCase())
    );
  }, [data, avatarFilter]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter(i => 
      i.name.toLowerCase().includes(itemFilter.toLowerCase()) || 
      i.category.toLowerCase().includes(itemFilter.toLowerCase())
    );
  }, [data, itemFilter]);

  // 🔄 Sorting Logic
  const sortedItems = useMemo(() => {
    const { type, avtKey, itmKey, direction } = sortConfig;
    
    // If sorting by avatar status, we need data
    if (type === "avatar" && !data) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let result = 0;

      if (type === "item") {
        // Sort by Item Property (name, category)
        const valA = a[itmKey as keyof typeof a]?.toString().toLowerCase() || "";
        const valB = b[itmKey as keyof typeof b]?.toString().toLowerCase() || "";
        result = valA.localeCompare(valB);
      } else {
        // Sort by Avatar Compatibility Status
        const compA = data?.compatibilities.find(c => c.avatarId === avtKey && c.itemId === a.id);
        const compB = data?.compatibilities.find(c => c.avatarId === avtKey && c.itemId === b.id);
        
        const weightA = STATUS_WEIGHT[(compA?.status || "undefined") as keyof typeof STATUS_WEIGHT];
        const weightB = STATUS_WEIGHT[(compB?.status || "undefined") as keyof typeof STATUS_WEIGHT];
        
        result = weightA - weightB;
      }

      // Apply direction
      return direction === "asc" ? result : -result;
    });
  }, [filteredItems, data, sortConfig]);

  // Handle Avatar Column Sort
  const handleAvatarSort = (avatarId: string) => {
    setSortConfig((prev) => {
      // Toggle direction if same avatar
      if (prev.type === "avatar" && prev.avtKey === avatarId) {
        return { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Default to desc (Official first) for new avatar
      return { ...prev, type: "avatar", avtKey: avatarId, direction: "desc" };
    });
  };

  // Handle Item Column Sort
  const handleItemSortKey = (key: string) => {
    setSortConfig((prev) => ({ ...prev, type: "item", itmKey: key }));
  };
  const handleItemDirection = () => {
    setSortConfig((prev) => ({ ...prev, type: "item", direction: prev.direction === "asc" ? "desc" : "asc" }));
  };

  // Set compatibility status directly (for Edit Mode)
  const setStatus = async (avatarId: string, itemId: string, newStatus: "official" | "modified" | "unsupported") => {
    if (!data) return;

    prevData.current = data;
    const newData = JSON.parse(JSON.stringify(data)) as MatrixResponse;
    
    const existingIdx = newData.compatibilities.findIndex(
      c => c.avatarId === avatarId && c.itemId === itemId
    );

    // Don't update if status is same
    if (existingIdx >= 0 && newData.compatibilities[existingIdx].status === newStatus) {
      return;
    }

    if (existingIdx >= 0) {
      newData.compatibilities[existingIdx].status = newStatus;
    } else {
      newData.compatibilities.push({
        userId: user!.id, 
        avatarId,
        itemId,
        status: newStatus,
        note: null,
      });
    }
    setData(newData);

    try {
      const res = await dashboardApi.compatibility.$post({
        json: { avatarId, itemId, status: newStatus }
      });

      if (!res.ok) {
        throw new Error("API Error");
      }
    } catch (e) {
      console.error(e);
      toast.error(t('dashboard.matrix.update_failed'));
      setData(prevData.current);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-vrclo1-500">
          {t('core.action.loading')}
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-red-500">
          {t('core.message.no_data')}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t('dashboard.matrix.page_title')} 
        description={t('dashboard.matrix.page_description')}
      >
         {/* Header Controls: Mode Switch */}
         <div className="flex items-center gap-2 bg-vrclo1-100 p-1 rounded-lg border">
            <Button
              variant={isEditing ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setIsEditing(false)}
              className={cn("gap-2", !isEditing && "bg-white shadow-sm")}
            >
              <Eye className="h-4 w-4" /> {t('dashboard.matrix.mode_view')}
            </Button>
            <Button
              variant={isEditing ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsEditing(true)}
              className={cn("gap-2", isEditing && "bg-white shadow-sm")}
            >
              <Pencil className="h-4 w-4" /> {t('dashboard.matrix.mode_edit')}
            </Button>
         </div>
      </PageHeader>

      {/* Filter Controls */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-vrclo1-400" />
          <Input 
            placeholder={t('dashboard.matrix.filter_item')}
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="pl-8 bg-white"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-vrclo1-400" />
          <Input 
            placeholder={t('dashboard.matrix.filter_avatar')}
            value={avatarFilter}
            onChange={(e) => setAvatarFilter(e.target.value)}
            className="pl-8 bg-white"
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-visible">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <table className="w-full text-sm text-left border-collapse">
            {/* Table Header */}
            <thead className="text-xs uppercase bg-vrclo1-100 text-vrclo1-700 sticky top-0 z-30 shadow-sm">
              <tr>
                {/* Item Column Header (Sortable) */}
                <th className="px-3 py-3 font-medium sticky left-0 bg-vrclo1-100 z-40 border-r min-w-[100px] w-[200px]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span>{t('core.data.item.$')}</span>
                    </div>

                    {/* Item Sort Controls */}
                    <div className="flex items-center bg-white/50 rounded-md border border-vrclo1-200">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                            <ListFilter className="h-3 w-3" />
                            {sortConfig.itmKey === 'category' ? t('core.data.item.category') : t('core.data.item.name')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleItemSortKey('name')}>
                            {t('core.data.item.name')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleItemSortKey('category')}>
                            {t('core.data.item.category')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <div className="w-px h-4 bg-vrclo1-200"></div>

                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleItemDirection}>
                        {sortConfig.type === 'item' ? 
                        (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                        : <ArrowUpDown className="h-3 w-3 text-vrclo1-400" />}
                      </Button>
                    </div>
                  </div>
                </th>

                {/* Avatar Columns Header (Sortable) */}
                {filteredAvatars.map((avatar) => (
                  <th key={avatar.id} className="px-2 py-3 font-medium text-center min-w-[100px] border-r last:border-r-0">
                    <div className="flex flex-col items-center gap-2">
                      
                      {/* Avatar Image */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Avatar className="h-10 w-10 cursor-pointer border border-vrclo1-200 hover:scale-110 transition-transform">
                            <AvatarImage src={avatar.thumbnailUrl || undefined} className="object-cover" />
                            <AvatarFallback><UserIcon className="h-5 w-5 text-vrclo1-400" /></AvatarFallback>
                          </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto p-0 overflow-hidden border-none shadow-xl rounded-lg z-[999]" side="bottom" sideOffset={5}>
                          <div className="relative">
                            {avatar.thumbnailUrl ? (
                              <img src={avatar.thumbnailUrl} alt={avatar.name} className="w-48 h-48 object-cover" />
                            ) : (
                              <div className="w-48 h-48 bg-vrclo1-100 flex items-center justify-center"><UserIcon className="h-12 w-12 text-vrclo1-300" /></div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-xs text-center truncate">{avatar.name}</div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>

                      <div className="flex items-center gap-1 justify-center w-full">
                        <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]" title={avatar.name}>
                          {avatar.name}
                        </span>
                        {/* Sort Button (Toggle only) */}
                        <button 
                          onClick={() => handleAvatarSort(avatar.id)}
                          className={cn(
                            "p-0.5 rounded hover:bg-vrclo1-200 transition-colors flex-shrink-0",
                            sortConfig.type === "avatar" && sortConfig.avtKey === avatar.id && "text-primary bg-vrclo1-200"
                          )}
                        >
                          {sortConfig.type === "avatar" && sortConfig.avtKey === avatar.id ? (
                            sortConfig.direction === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-vrclo1-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Items */}
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-vrclo1-50">
                  {/* Row Header: Item */}
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="h-10 w-10 rounded-md bg-vrclo1-100 flex-shrink-0 overflow-hidden cursor-pointer border border-vrclo1-200">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-vrclo1-400" /></div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" align="start" sideOffset={10} className="w-auto p-0 overflow-hidden border-none shadow-xl rounded-lg z-[999]">
                          <div className="relative">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.name} className="w-48 h-48 object-cover" />
                            ) : (
                              <div className="w-48 h-48 bg-vrclo1-100 flex items-center justify-center"><ImageIcon className="h-12 w-12 text-vrclo1-300" /></div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-xs">
                              <p className="font-bold truncate">{item.name}</p>
                              <p className="opacity-80 text-[10px]">{item.category}</p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate block max-w-[140px]" title={item.name}>{item.name}</span>
                        <span className="text-xs text-vrclo1-400 capitalize">{item.category}</span>
                      </div>
                    </div>
                  </td>

                  {/* Intersection Cells */}
                  {filteredAvatars.map((avatar) => {
                    const comp = data.compatibilities.find(
                      (c) => c.avatarId === avatar.id && c.itemId === item.id
                    );
                    const status = comp?.status || "unsupported";

                    return (
                      <td
                        key={`${avatar.id}-${item.id}`}
                        className={cn(
                          "px-2 py-3 text-center border-r last:border-r-0 transition-colors",
                          !isEditing && "hover:bg-vrclo1-100",
                          // Highlight sorted column
                          sortConfig.type === "avatar" && sortConfig.avtKey === avatar.id && !isEditing && "bg-vrclo1-50/50"
                        )}
                      >
                        <div className="flex justify-center items-center h-full min-h-[32px]">
                          {/* 👁️ View Mode */}
                          {!isEditing && (
                            <>
                              {status === "official" && <Badge className="bg-compatibilitystatus-official text-compatibilitystatus-official-foreground border-compatibilitystatus-official hover:bg-compatibilitystatus-official/80">{t('dashboard.matrix.status.official')}</Badge>}
                              {status === "modified" && <Badge className="bg-compatibilitystatus-modified text-compatibilitystatus-modified-foreground border-compatibilitystatus-modified hover:bg-compatibilitystatus-modified/80">{t('dashboard.matrix.status.modified')}</Badge>}
                              {status === "unsupported" && <Badge className="bg-compatibilitystatus-unsupported text-compatibilitystatus-unsupported-foreground border-compatibilitystatus-unsupported hover:bg-compatibilitystatus-unsupported/80">{t('dashboard.matrix.status.unsupported')}</Badge>}
                            </>
                          )}

                          {/* ✏️ Edit Mode: 3 Buttons */}
                          {isEditing && (
                            <div className="flex items-center gap-1 bg-vrclo1-100 p-1 rounded-full">
                              <button
                                onClick={() => setStatus(avatar.id, item.id, "official")}
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                  status === "official" ? "bg-compatibilitystatus-official text-compatibilitystatus-official-foreground hover:bg-compatibilitystatus-official/80"
                                  : "text-compatibilitystatus-official hover:bg-compatibilitystatus-official/20 hover:text-compatibilitystatus-official-foreground"
                                )}
                                title={t('dashboard.matrix.status.official')}
                              >
                                <Check className="h-3 w-3" />
                              </button>

                              <button
                                onClick={() => setStatus(avatar.id, item.id, "modified")}
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                  status === "modified" 
                                    ? "bg-compatibilitystatus-modified text-compatibilitystatus-modified-foreground hover:bg-compatibilitystatus-modified/80" 
                                    : "text-compatibilitystatus-modified hover:bg-compatibilitystatus-modified/20 hover:text-compatibilitystatus-modified-foreground"
                                )}
                                title={t('dashboard.matrix.status.modified')}
                              >
                                <AlertCircle className="h-3 w-3" />
                              </button>

                              <button
                                onClick={() => setStatus(avatar.id, item.id, "unsupported")}
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                  status === "unsupported" 
                                    ? "bg-compatibilitystatus-unsupported text-compatibilitystatus-unsupported-foreground hover:bg-compatibilitystatus-unsupported/80" 
                                    : "text-compatibilitystatus-unsupported hover:bg-compatibilitystatus-unsupported/20 hover:text-compatibilitystatus-unsupported-foreground"
                                )}
                                title={t('dashboard.matrix.status.unsupported')}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}