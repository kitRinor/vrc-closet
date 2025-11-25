import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/pageLayout";

// UI
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/pageHeader";

// Extract the response type for the matrix endpoint
type MatrixResponse = InferResponseType<typeof api.matrix.$get, 200>;

export default function MatrixPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState<MatrixResponse | null>(null);
  const prevData = useRef<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch matrix data on load
  const fetchMatrix = async () => {
    try {
      const res = await api.matrix.$get();
      if (res.ok) {
        setData(await res.json());
        // toast.success(t('matrix.fetch_success')); // Optional: Notify on load
      } else {
        toast.error(t('matrix.fetch_failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.action.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatrix();
    }
  }, [user]);

  // Toggle compatibility status (official -> modified -> unsupported -> official)
  const toggleStatus = async (avatarId: string, itemId: string, currentStatus?: string) => {
    const nextStatus =
      currentStatus === "official" ? "modified" :
      currentStatus === "modified" ? "unsupported" : "official";

    // 1. Optimistic UI Update
    // Deep copy to avoid mutation issues, or use a functional state update if preferred
    prevData.current = data;
    const newData = JSON.parse(JSON.stringify(data)) as MatrixResponse;
    
    // Find if a record already exists
    const existingIdx = newData.compatibilities.findIndex(
      c => c.avatarId === avatarId && c.itemId === itemId
    );


    if (existingIdx >= 0) {
      // Update existing
      newData.compatibilities[existingIdx].status = nextStatus;
    } else {
      // Create new entry
      newData.compatibilities.push({
        userId: user!.id, // Should be present if user is logged in
        avatarId,
        itemId,
        status: nextStatus,
        note: null,
      });
    }
    setData(newData);

    // 2. Send API Request
    try {
      // Assuming `api.compatibility` routes exist for updating/upserting
      const res = await api.compatibility.$post({
        json: { avatarId, itemId, status: nextStatus }
      });

      if (!res.ok) {
        throw new Error("API Error");
      }
      toast.success(t('matrix.update_success')); // Optional: Can be noisy if toggling quickly
    } catch (e) {
      console.error(e);
      toast.error(t('matrix.update_failed'));
      // Revert optimistic update here if needed 
      setData(prevData.current);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-zinc-500">
          {t('core.action.loading')}
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-red-500">
          {t('core.action.no_data')}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title={t('matrix.page_title')} 
        description={t('matrix.page_description')}
      />
      {/* Matrix Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            {/* Table Header: Avatars */}
            <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium sticky left-0 bg-zinc-100 dark:bg-zinc-800 z-20 border-r dark:border-zinc-700 min-w-[150px]">
                  {t('core.data.item.name')} \ {t('core.data.avatar.name')}
                </th>
                {data.avatars.map((avatar) => (
                  <th key={avatar.id} className="px-4 py-3 font-medium text-center min-w-[100px] border-r dark:border-zinc-700 last:border-r-0">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm whitespace-nowrap">{avatar.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Items */}
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  {/* Row Header: Item Name */}
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r dark:border-zinc-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">{item.name}</span>
                      <span className="text-xs text-zinc-400 capitalize">{item.category}</span>
                    </div>
                  </td>

                  {/* Intersection Cells: Status */}
                  {data.avatars.map((avatar) => {
                    const comp = data.compatibilities.find(
                      (c) => c.avatarId === avatar.id && c.itemId === item.id
                    );
                    const status = comp?.status || "unsupported";

                    return (
                      <td
                        key={`${avatar.id}-${item.id}`}
                        className="px-2 py-3 text-center border-r dark:border-zinc-700 last:border-r-0 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => toggleStatus(avatar.id, item.id, status)}
                      >
                        <div className="flex justify-center items-center h-full">
                          {status === "official" && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              {t('matrix.status.official')}
                            </Badge>
                          )}
                          {status === "modified" && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                              {t('matrix.status.modified')}
                            </Badge>
                          )}
                          {status === "unsupported" && (
                            <span className="text-zinc-200 dark:text-zinc-700 block w-full h-full select-none">
                              {t('matrix.status.unsupported')}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {data.items.length === 0 && (
                <tr>
                  <td colSpan={data.avatars.length + 1} className="p-8 text-center text-zinc-400">
                    {t('core.action.no_data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}