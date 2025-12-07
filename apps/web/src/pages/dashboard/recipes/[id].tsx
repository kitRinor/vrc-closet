import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";
import { ImageUploader } from "@/components/common/ImageUploader";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { InferResponseType } from "hono";
import { PageHeader } from "@/components/common/PageHeader";


// Type

type RecipeDetail = InferResponseType<typeof dashboardApi.recipes[':id']['$get'], 200>;


export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  
  // Fetch Recipe
  const fetchRecipe = async () => {
    if (!id) return;
    try {
      const res = await dashboardApi.recipes[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        // @ts-ignore - Adjusting types if necessary
        setRecipe(data as RecipeRes);
      } else {
        toast.error("Failed to load recipe");
        navigate("/dashboard/recipes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error loading recipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  // Save handler
  const handleSave = async () => {
    if (!recipe || !id) return;
    setSaving(true);

    try {
      // Construct payload
      // Note: This assumes API accepts full object update or specific fields
      // Adjust payload based on your API expectation
      const res = await dashboardApi.recipes[':id'].$put({
        param: { id },
        json: {
          name: recipe.name,
          description: recipe.description || undefined,
          state: recipe.state,
          imageUrl: recipe.imageUrl || undefined,
          // Sending updated steps and assets logic would be here
          // For MVP, we might need separate endpoints or a complex PUT
        }
      });

      if (res.ok) {
        toast.success(t('core.message.save_success'));
        fetchRecipe(); // Reload to get synced state
      } else {
        toast.error("Failed to save");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving");
    } finally {
      setSaving(false);
    }
  };

  // Local state updaters
  const updateField = (key: keyof RecipeDetail, value: any) => {
    if (!recipe) return;
    setRecipe({ ...recipe, [key]: value });
  };

  if (loading) return <PageLayout><div className="p-10 text-center">{t('core.action.loading')}</div></PageLayout>;
  if (!recipe) return null;

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title={t('dashboard.recipes.edit.page_title')}
        description={t('dashboard.recipes.edit.page_description')}
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t('core.action.save')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Info & Thumbnail */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recipes.edit.basic_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>サムネイル</Label>
                <div className="aspect-video bg-muted rounded-md overflow-hidden border border-border relative">
                   {recipe.imageUrl ? (
                     <img src={recipe.imageUrl} className="w-full h-full object-cover" />
                   ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                     </div>
                   )}
                </div>
                <ImageUploader 
                  category="other" // Using 'other' for recipe thumbnails
                  defaultUrl={recipe.imageUrl || undefined}
                  onUploadSuccess={(url) => updateField('imageUrl', url)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('dashboard.recipes.create.recipe_name')}</Label>
                <Input 
                  value={recipe.name} 
                  onChange={e => updateField('name', e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>{t('dashboard.recipes.edit.public_settings')}</Label>
                <Select 
                  value={recipe.state} 
                  onValueChange={(val: any) => updateField('state', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">{t('dashboard.recipes.edit.status.private')}</SelectItem>
                    <SelectItem value="unlisted">{t('dashboard.recipes.edit.status.unlisted')}</SelectItem>
                    <SelectItem value="public">{t('dashboard.recipes.edit.status.public')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>説明・メモ</Label>
                <Textarea 
                  value={recipe.description || ""} 
                  onChange={e => updateField('description', e.target.value)} 
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Base Avatar Display (Read Only) */}
          <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-sm text-muted-foreground uppercase">Base Avatar</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-muted rounded-full overflow-hidden">
                    <img src={recipe.baseAsset?.imageUrl || undefined} className="w-full h-full object-cover" />
                 </div>
                 <span className="font-bold">{recipe.baseAsset?.name}</span>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Steps & Ingredients */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Steps */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.recipes.edit.steps')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => toast.info("Step adding not implemented in this snippet")}>
                <Plus className="h-4 w-4 mr-2" /> {t('dashboard.recipes.edit.add_step')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipe.steps.length === 0 && <p className="text-muted-foreground text-sm">手順が登録されていません。</p>}
              
              {recipe.steps.sort((a,b) => a.stepNumber - b.stepNumber).map((step) => (
                <div key={step.id} className="flex gap-4 p-4 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors group">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input value={step.name} readOnly className="font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0" />
                    <Textarea value={step.description} readOnly className="resize-none border-none shadow-none p-0 min-h-[40px] focus-visible:ring-0 text-muted-foreground" />
                    {step.imageUrl && (
                        <div className="h-24 w-auto rounded-md overflow-hidden border border-border inline-block">
                             <img src={step.imageUrl} className="h-full object-cover" />
                        </div>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.recipes.edit.ingredients')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => toast.info("Asset adding not implemented in this snippet")}>
                <Plus className="h-4 w-4 mr-2" /> {t('dashboard.recipes.edit.add_ingredient')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
               {recipe.assets.length === 0 && <p className="text-muted-foreground text-sm">材料が登録されていません。</p>}

               {recipe.assets.map((asset) => (
                 <div key={asset.id} className="flex items-center gap-3 p-3 border border-border rounded-md">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                       <img src={asset.asset?.imageUrl || undefined} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-medium truncate">{asset.asset?.name}</p>
                       <p className="text-xs text-muted-foreground">{asset.asset?.category}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </PageLayout>
  );
}