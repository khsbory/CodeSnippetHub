import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, 
  KeyRound, 
  UserX, 
  AlertTriangle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User, SnippetWithUser } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

// 비밀번호 변경 스키마
const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, "현재 비밀번호를 입력해주세요."),
  newPassword: z.string()
    .min(8, "새 비밀번호는 8자 이상이어야 합니다.")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다."),
  confirmPassword: z.string()
    .min(1, "비밀번호 확인을 입력해주세요."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

// 회원 탈퇴 스키마
const accountDeleteSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요."),
  confirmation: z.string().min(1, "확인 문구를 입력해주세요.")
}).refine((data) => data.confirmation === "탈퇴하겠습니다", {
  message: "확인 문구가 일치하지 않습니다.",
  path: ["confirmation"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
type AccountDeleteFormValues = z.infer<typeof accountDeleteSchema>;

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // 자신의 프로필인지 확인
  const isProfile = !id && currentUser;
  
  // URL에서 userId 가져오거나 현재 사용자 ID 사용
  const userId = id ? parseInt(id) : (currentUser?.id || 0);
  
  // 자신의 프로필인지 확인 (다른 방법으로)
  const isOwnProfile = currentUser?.id === userId;
  
  // 다이얼로그 상태 관리
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 비밀번호 변경 폼
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  
  // 회원 탈퇴 폼
  const deleteForm = useForm<AccountDeleteFormValues>({
    resolver: zodResolver(accountDeleteSchema),
    defaultValues: {
      password: "",
      confirmation: ""
    }
  });
  
  // 비밀번호 변경 뮤테이션
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeFormValues) => {
      const res = await apiRequest("POST", "/api/users/password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      setPasswordDialogOpen(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // 회원 탈퇴 뮤테이션
  const deleteAccountMutation = useMutation({
    mutationFn: async (data: AccountDeleteFormValues) => {
      const res = await apiRequest("DELETE", "/api/users", { password: data.password });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "계정 삭제 완료",
        description: "계정이 성공적으로 삭제되었습니다.",
      });
      // 로그아웃 처리
      queryClient.setQueryData(["/api/user"], null);
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "계정 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // 비밀번호 변경 제출 핸들러
  const onChangePasswordSubmit = (values: PasswordChangeFormValues) => {
    changePasswordMutation.mutate(values);
  };
  
  // 회원 탈퇴 제출 핸들러
  const onDeleteAccountSubmit = (values: AccountDeleteFormValues) => {
    deleteAccountMutation.mutate(values);
  };
  
  // Fetch user data (자신의 프로필이면 현재 사용자 데이터 사용)
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !isProfile,
    initialData: isProfile ? currentUser : undefined
  });
  
  // Fetch user snippets
  const { data: snippets, isLoading: isLoadingSnippets } = useQuery<SnippetWithUser[]>({
    queryKey: [`/api/users/${userId}/snippets`],
    enabled: !!userId,
  });
  
  // Calculate user stats
  const totalSnippets = snippets?.length || 0;
  const totalViews = snippets?.reduce((sum, snippet) => sum + (snippet.views || 0), 0) || 0;
  
  // Get user's most used language
  const getTopLanguage = () => {
    if (!snippets || snippets.length === 0) return null;
    
    const languages = snippets.reduce<Record<string, number>>((acc, snippet) => {
      const lang = snippet.language;
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    
    const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0];
    return topLanguage ? topLanguage[0] : null;
  };
  
  const topLanguage = getTopLanguage();
  
  if (isLoadingUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 text-center md:text-left">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-32 mt-2 mx-auto md:mx-0" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
            
            <Skeleton className="h-12 w-full max-w-md mt-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-muted-foreground">The user you're looking for doesn't exist or was removed.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const joinedDate = user.createdAt 
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
    : '';
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* User Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-10">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-4xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-muted-foreground">Joined {joinedDate}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="text-2xl font-bold text-primary">{totalSnippets}</h3>
                  <p className="text-sm text-muted-foreground">Snippets</p>
                </div>
                
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="text-2xl font-bold text-primary">{totalViews}</h3>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
                
                <div className="bg-card rounded-lg p-4 border">
                  {topLanguage ? (
                    <>
                      <div className="flex justify-center md:justify-start">
                        <Badge className="mb-1 text-sm">{topLanguage}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Top Language</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-muted-foreground">-</h3>
                      <p className="text-sm text-muted-foreground">Top Language</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* User Content Tabs */}
          <Tabs defaultValue="snippets">
            <TabsList className="mb-6">
              <TabsTrigger value="snippets">스니펫</TabsTrigger>
              {isOwnProfile && <TabsTrigger value="settings">계정 설정</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="snippets">
              {isLoadingSnippets ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : snippets && snippets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {snippets.map(snippet => (
                    <SnippetCard key={snippet.id} snippet={snippet} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">작성한 스니펫이 없습니다</h3>
                  <p className="text-muted-foreground">
                    아직 공유한 코드 스니펫이 없습니다.
                  </p>
                </div>
              )}
            </TabsContent>
            
            {isOwnProfile && (
              <TabsContent value="settings">
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* 비밀번호 변경 섹션 */}
                  <div className="bg-card p-6 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">비밀번호 변경</h2>
                    <p className="text-muted-foreground mb-4">주기적으로 비밀번호를 변경하여 계정의 보안을 유지하세요.</p>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      <KeyRound className="h-4 w-4" />
                      비밀번호 변경
                    </Button>
                  </div>
                  
                  {/* 계정 삭제 섹션 (관리자가 아닌 경우에만 표시) */}
                  {!user.isAdmin && (
                    <div className="bg-card p-6 rounded-lg border border-destructive/20">
                      <h2 className="text-xl font-semibold mb-4">계정 삭제</h2>
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>주의</AlertTitle>
                        <AlertDescription>
                          계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                          이 작업은 되돌릴 수 없습니다.
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="destructive" 
                        className="flex items-center gap-2"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <UserX className="h-4 w-4" />
                        계정 삭제
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          {/* 비밀번호 변경 다이얼로그 */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>비밀번호 변경</DialogTitle>
                <DialogDescription>
                  새로운 비밀번호는 최소 8자 이상이어야 하며, 대문자, 소문자, 숫자를 포함해야 합니다.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">현재 비밀번호</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : "비밀번호 변경"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* 계정 삭제 다이얼로그 */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>계정 삭제</DialogTitle>
                <DialogDescription>
                  계정을 삭제하면 모든 스니펫과 활동 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={deleteForm.handleSubmit(onDeleteAccountSubmit)}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="계정의 비밀번호를 입력하세요"
                      {...deleteForm.register("password")}
                    />
                    {deleteForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{deleteForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmation">확인</Label>
                    <Alert variant="destructive" className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        계정을 삭제하려면 아래에 "탈퇴하겠습니다"를 입력하세요
                      </AlertDescription>
                    </Alert>
                    <Input
                      id="confirmation"
                      placeholder="탈퇴하겠습니다"
                      {...deleteForm.register("confirmation")}
                    />
                    {deleteForm.formState.errors.confirmation && (
                      <p className="text-sm text-destructive">{deleteForm.formState.errors.confirmation.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" variant="destructive" disabled={deleteAccountMutation.isPending}>
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : "계정 삭제"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}
