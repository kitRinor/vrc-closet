import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Recipe } from "@/lib/api";
import { Box, ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Prop {
  item: Recipe;
  onClick?: () => void;
}

export function RecipeCardView({ item, onClick }: Prop) {
  const { t } = useTranslation();
  return (
    <Card 
      onClick={onClick} 
      className="min-w-[33%] w-[33%] md:min-w-[25%] md:w-[25%] lg:min-w-[20%] lg:w-[20%]h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border-border"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
        )}
        
        {/* State Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={item.state === 'public' ? 'default' : 'secondary'} className="shadow-sm">
            {t(`dashboard.recipes.edit.status.${item.state}`)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
        
        {/* Base Asset Info (Optional) */}
        {item.baseAsset ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={item.baseAsset.imageUrl || undefined} />
                    <AvatarFallback><Box className="h-3 w-3" /></AvatarFallback>
                </Avatar>
                <span className="truncate">{item.baseAsset.name}</span>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 opacity-50">
                <Box className="h-4 w-4" />
                <span className="truncate">No Base Asset</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}