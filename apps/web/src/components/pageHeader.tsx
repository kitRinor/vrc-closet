import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";



export function PageHeader({ 
  title, 
  description, 
  backBtn = true,
  children 
}: { 
  title: string; 
  description?: string; 
  backBtn?: boolean;
  children?: React.ReactNode 
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button 
          onClick={ backBtn ? () => navigate(-1) : undefined }
          variant="ghost" 
          size="icon"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">{t('core.action.back')}</span>
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-zinc-500 text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}