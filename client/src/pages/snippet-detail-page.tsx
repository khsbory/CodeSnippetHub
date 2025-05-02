import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Link, 
  ArrowLeft, 
  Eye, 
  Pencil, 
  Trash2, 
  MoreVertical 
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/lib/usePageTitle";
import { SnippetWithUser } from "@shared/schema";
import { EditSnippetDialog } from "@/components/edit-snippet-dialog";
import { DeleteSnippetDialog } from "@/components/delete-snippet-dialog";

export default function SnippetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const snippetId = parseInt(id);
  
  // State for edit/delete dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch snippet details
  const { data: snippet, isLoading, error } = useQuery<SnippetWithUser>({
    queryKey: [`/api/snippets/${snippetId}`],
  });
  
  // Set page title based on snippet data
  usePageTitle(
    snippet ? `${snippet.title}` : '스니펫 상세 보기',
    snippet ? `${snippet.description} - ${snippet.language} 코드 스니펫` : '코드 스니펫 상세 페이지'
  );

  // Share snippet URL
  const copyUrl = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL 복사됨",
        description: "스니펫 URL이 클립보드에 복사되었습니다",
      });
    } catch (error) {
      toast({
        title: "URL 복사 실패",
        description: "클립보드에 복사할 수 없습니다",
        variant: "destructive",
      });
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "스니펫 로딩 오류",
        description: "스니펫을 찾을 수 없거나 삭제되었습니다",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [error, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로
            </Button>
            
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              
              <div className="flex items-center gap-3 mt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
              
              <Skeleton className="h-96 w-full mt-6" />
              
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  const formattedDate = snippet.createdAt 
    ? formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })
    : '';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">{snippet.title}</h1>
          {snippet.description && (
            <p className="text-muted-foreground mb-6">{snippet.description}</p>
          )}
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={snippet.user?.avatar || undefined} alt={snippet.user?.username || '사용자'} />
                <AvatarFallback>
                  {snippet.user?.username ? snippet.user.username.substring(0, 2).toUpperCase() : 'UN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-medium text-foreground"
                  onClick={() => navigate(`/users/${snippet.user?.id || ''}`)}
                >
                  {snippet.user?.username || '사용자'}
                </Button>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900">
                {snippet.language}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Eye className="h-4 w-4 mr-1" />
                {snippet.views}
              </div>
              
              {/* 작성자 또는 관리자만 볼 수 있는 수정/삭제 버튼 */}
              {user && (user.id === snippet.userId || user.isAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="스니펫 관리 메뉴">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setEditDialogOpen(true)}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span aria-label="스니펫 편집">편집</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span aria-label="스니펫 삭제">삭제</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <Card className="mb-8">
            <CardContent className="p-0">
              <SyntaxHighlighter
                code={snippet.code}
                language={snippet.language}
                showLanguageBadge={false}
                showLineNumbers={true}
                maxHeight="none"
                title={snippet.title}
                snippetId={snippetId}
                showShareButton={true}
                showCopyButton={true}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Edit Snippet Dialog */}
      {snippet && (
        <EditSnippetDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          snippet={snippet}
        />
      )}
      
      {/* Delete Snippet Dialog */}
      {snippet && (
        <DeleteSnippetDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          snippetId={snippet.id}
          snippetTitle={snippet.title}
        />
      )}
    </div>
  );
}