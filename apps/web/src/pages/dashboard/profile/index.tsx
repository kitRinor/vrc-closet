import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi, authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { ImageUploader } from "@/components/common/ImageUploader";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, Loader2, User as UserIcon, Mail, Lock, AlertCircle, AtSign, KeyRound, Send, Pencil, CameraIcon } from "lucide-react";
import { toast } from "sonner";
import { getDummyUserAvatarUrl } from "@/lib/dummyImg";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // UI States
  const [isEditingProfile, setIsEditingProfile] = useState(false); // 👈 編集モード管理

  // Loading States
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isEmailUpdating, setIsEmailUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Security Form States
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Dialog States
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Fetch latest profile data
  const fetchProfile = useCallback(async () => {
    try {
      const res = await dashboardApi.profile.$get();
      if (res.ok) {
        const data = await res.json();
        setDisplayName(data.displayName || "");
        setHandle(data.handle);
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || undefined);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Cancel Editing (Reset form)
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    fetchProfile(); // Re-fetch data to reset form fields
  };

  // 1. Update Public Profile
  const handleUpdateProfile = async () => {
    setIsProfileUpdating(true);
    try {
      const res = await dashboardApi.profile.$put({
        json: {
          displayName,
          handle,
          bio,
          avatarUrl,
        }
      });

      if (res.ok) {
        toast.success(t('core.message.update_success'));
        const data = await res.json();
        // Update state with response
        setDisplayName(data.displayName || "");
        setHandle(data.handle);
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || undefined);
        
        setIsEditingProfile(false); // Exit edit mode
      } else {
        const error = await res.json();
        // @ts-ignore
        toast.error(error.error || t('core.message.update_failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsProfileUpdating(false);
    }
  };

  // 2. Update Password
  const handleUpdatePassword = async () => {
    if (!newPassword || !currentPassword) return;
    
    setIsPasswordUpdating(true);
    try {
      const res = await authApi.updatePassword.$put({
        json: {
          currentPassword,
          newPassword,
        }
      });

      if (res.ok) {
        toast.success("パスワードを更新しました");
        setNewPassword("");
        setCurrentPassword("");
      } else {
        const error = await res.json();
        // @ts-ignore
        toast.error(error.error || "パスワードの更新に失敗しました");
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  // 3. Request Email Update
  const handleRequestEmailUpdate = async () => {
    if (!email) return;
    
    setIsEmailUpdating(true);
    try {
      const res = await authApi.updateEmail.request.$post({
        json: { email }
      });

      if (res.ok) {
        toast.success("確認コードを送信しました");
        setIsVerifyDialogOpen(true);
      } else {
        const error = await res.json();
        // @ts-ignore
        toast.error(error.error || "メールアドレスの更新リクエストに失敗しました");
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsEmailUpdating(false);
    }
  };

  // 4. Verify Email Code
  const handleVerifyEmail = async () => {
    if (!verificationCode) return;
    setIsVerifying(true);

    try {
      const res = await authApi.updateEmail.confirm.$post({
        json: { code: verificationCode }
      });

      if (res.ok) {
        toast.success("メールアドレスを更新しました");
        setIsVerifyDialogOpen(false);
        setEmail("");
        setVerificationCode("");
      } else {
        const error = await res.json();
        // @ts-ignore
        toast.error(error.error || "無効なコードです");
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAvatarUploadSuccess = (url: string) => {
    if (url.length > 0) {
      setAvatarUrl(url);
    } else {
      setAvatarUrl(getDummyUserAvatarUrl(user?.id || "")); // reset to default
    }
    setIsAvatarDialogOpen(false);
  };

  if (!user) return null;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-foreground">プロフィール編集</h1>
          <p className="text-muted-foreground mt-2">アカウント情報の確認と変更ができます。</p>
        </div>

        {/* --- Public Profile Section --- */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>他のユーザーに公開される情報です。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left: Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                      <UserIcon className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Edit Button (Only show in Edit Mode) */}
                  {isEditingProfile && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full shadow-md border-2 border-background hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setIsAvatarDialogOpen(true)}
                      title="アバター画像を変更"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditingProfile && (
                  <p className="text-xs text-muted-foreground text-center">
                    クリックして変更
                  </p>
                )}
              </div>

              {/* Right: Profile Form */}
              <div className="flex-1 space-y-6">
                {/* Handle */}
                <div className="space-y-2">
                  <Label htmlFor="handle">ユーザーID (@)</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="handle"
                      value={handle} 
                      onChange={(e) => setHandle(e.target.value)}
                      className="pl-9 bg-background disabled:opacity-100 disabled:cursor-text"
                      placeholder="ユーザーID (半角英数)"
                      disabled={!isEditingProfile}
                    />
                  </div>
                  {isEditingProfile && (
                    <p className="text-xs text-muted-foreground">
                      半角英数字、ハイフン、アンダースコアのみ使用可能です。
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">表示名</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="displayName"
                      value={displayName || ""} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      className="pl-9 bg-background disabled:opacity-100 disabled:cursor-text"
                      placeholder="表示名を入力"
                      disabled={!isEditingProfile}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="自己紹介を入力..."
                    className="bg-background min-h-[100px] disabled:opacity-100 disabled:cursor-text"
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-border">
              {!isEditingProfile ? (
                // 🟢 View Mode: Edit Button
                <Button onClick={() => setIsEditingProfile(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('core.action.edit')}
                </Button>
              ) : (
                // 🟠 Edit Mode: Cancel & Save Buttons
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    {t('core.action.cancel')}
                  </Button>
                  <Button onClick={handleUpdateProfile} disabled={isProfileUpdating}>
                    {isProfileUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('core.action.save')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- Security Section --- */}
        <Card>
          <CardHeader>
            <CardTitle>セキュリティ設定</CardTitle>
            <CardDescription>ログインに関する設定です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Email Update Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-foreground">メールアドレス変更</h3>
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">新しいメールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-9 bg-background"
                    placeholder="新しいメールアドレス"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    <span>変更確認メールが送信されます</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRequestEmailUpdate} 
                  disabled={isEmailUpdating || !email}
                >
                  {isEmailUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Send className="h-3 w-3 mr-2" />}
                  メール送信
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Password Update Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-foreground">パスワード変更</h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">現在のパスワード</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="currentPassword"
                      type="password"
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className="pl-9 bg-background"
                      placeholder="現在のパスワード"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">新しいパスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="newPassword"
                      type="password"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="pl-9 bg-background"
                      placeholder="6文字以上"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpdatePassword} 
                  disabled={isPasswordUpdating || !newPassword || !currentPassword}
                >
                  {isPasswordUpdating && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                  パスワードを変更
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メールアドレスの確認</DialogTitle>
            <DialogDescription>
              {email} 宛に確認コードを送信しました。<br />
              メールに記載された6桁のコードを入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="code" className="sr-only">確認コード</Label>
            <Input
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsVerifyDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleVerifyEmail} disabled={isVerifying || verificationCode.length !== 6}>
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認して変更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロフィール画像を変更</DialogTitle>
            <DialogDescription>
              新しい画像をアップロードしてください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <div className="w-full max-w-sm">
               <ImageUploader
                  category="avatar"
                  defaultUrl={avatarUrl}
                  onUploadSuccess={handleAvatarUploadSuccess}
                />
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  推奨サイズ: 400x400px 以上 (JPG, PNG, WebP)
                </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAvatarDialogOpen(false)}>キャンセル</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageLayout>
  );
}