import { Card, CardFooter } from "@/components/ui/card";
import { Asset } from "@/lib/api";
import { UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Prop {
  item: Asset;
  onClick?: () => void;
}
export function AssetCardView({ item, onClick }: Prop) {
  const { t } = useTranslation();
  return (
    <Card 
      onClick={onClick} 
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
  );
}