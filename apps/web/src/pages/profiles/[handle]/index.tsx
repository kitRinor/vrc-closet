import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { publicApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserIcon, CalendarDays, Frown } from "lucide-react";
import { toast } from "sonner";

// Types
import type { InferResponseType } from "hono/client";

// Define response type from the public API endpoint
type PublicProfile = InferResponseType<typeof publicApi.profiles[':handle']['$get'], 200>;

export default function PublicProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!handle) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await publicApi.profiles[':handle'].$get({
          param: { handle },
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError(true);
          // 404 etc.
        }
      } catch (e) {
        console.error(e);
        setError(true);
        toast.error(t('core.message.error_occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [handle]);

  // Loading State
  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </PageLayout>
    );
  }

  // Error or Not Found State
  if (error || !profile) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Frown className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-bold text-muted-foreground">
            {t('profiles.not_found')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('profiles.not_found_description')}
          </p>
          <Link to="/">
            <Button variant="outline">{t('index.get_started')}</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Profile Header */}
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="flex flex-col items-center text-center space-y-4 pb-2">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                {profile.displayName?.[0] || <UserIcon className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              <p className="text-lg text-muted-foreground">@{profile.handle}</p>
            </div>

            {/* Metadata (e.g. Joined date) */}
            {/* <div className="flex items-center text-sm text-muted-foreground gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>
                {t('profile.joined_at', { 
                  date: new Date(profile.createdAt).toLocaleDateString() 
                })}
              </span>
            </div> */}
          </CardHeader>

          <CardContent className="max-w-2xl mx-auto text-center pt-4">
             {/* Bio Section */}
            <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
              {profile.bio || <span className="text-muted-foreground italic">{t('profiles.bio_empty')}</span>}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Public Content Sections (Future implementation) */}
        {/* Example: Public Outfits Grid could go here */}
        <div className="space-y-6">
            <h2 className="text-xl font-semibold px-2">{t('profiles.users_outfits')} (Public)</h2>
            <div className="bg-muted/30 rounded-lg p-10 text-center text-muted-foreground border border-dashed">
                Coming Soon: User's public outfits will be displayed here.
            </div>
        </div>

      </div>
    </PageLayout>
  );
}