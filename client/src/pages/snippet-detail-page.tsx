import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { CommentSection } from "@/components/comment-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, Heart, Share2, ArrowLeft, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SnippetWithUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function SnippetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const snippetId = parseInt(id);

  // Fetch snippet details
  const { data: snippet, isLoading, error } = useQuery<SnippetWithUser>({
    queryKey: [`/api/snippets/${snippetId}`],
  });

  // Fetch like count and user's like status
  const { data: likeData } = useQuery<{ count: number; userLiked: boolean }>({
    queryKey: [`/api/snippets/${snippetId}/likes`],
    enabled: !!snippetId,
  });

  // Fetch bookmark status
  const { data: bookmarkData } = useQuery<{ bookmarked: boolean }>({
    queryKey: [`/api/snippets/${snippetId}/bookmark`],
    enabled: !!snippetId && !!user,
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to like snippets",
          variant: "destructive",
        });
        return;
      }
      const res = await apiRequest("POST", `/api/snippets/${snippetId}/like`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippetId}/likes`] });
    },
  });

  // Bookmark/unbookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to bookmark snippets",
          variant: "destructive",
        });
        return;
      }
      const res = await apiRequest("POST", `/api/snippets/${snippetId}/bookmark`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippetId}/bookmark`] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
  });

  // Share snippet
  const shareSnippet = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Snippet link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error sharing snippet",
        description: "Could not copy the link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading snippet",
        description: "The snippet could not be found or has been removed",
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
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
              
              <Skeleton className="h-32 w-full mt-8" />
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">{snippet.title}</h1>
          {snippet.description && (
            <p className="text-muted-foreground mb-6">{snippet.description}</p>
          )}
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={snippet.user.avatar} alt={snippet.user.username} />
                <AvatarFallback>{snippet.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-medium text-foreground"
                  onClick={() => navigate(`/users/${snippet.user.id}`)}
                >
                  {snippet.user.username}
                </Button>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900">
                {snippet.language}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Eye className="h-4 w-4 mr-1" />
                {snippet.views}
              </div>
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
              />
            </CardContent>
          </Card>
          
          <div className="flex gap-2 mb-8">
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2",
                likeData?.userLiked && "text-primary border-primary"
              )}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={cn(
                "h-4 w-4",
                likeData?.userLiked && "fill-primary"
              )} />
              Like
              {likeData?.count ? ` (${likeData.count})` : ""}
            </Button>
            
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2",
                bookmarkData?.bookmarked && "text-primary border-primary"
              )}
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
            >
              <BookmarkIcon className={cn(
                "h-4 w-4",
                bookmarkData?.bookmarked && "fill-primary"
              )} />
              Bookmark
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={shareSnippet}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
          
          <CommentSection snippetId={snippetId} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
