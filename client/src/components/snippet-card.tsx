import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkIcon, Heart, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { SnippetWithUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SnippetCardProps {
  snippet: SnippetWithUser;
  onLike?: () => void;
  onBookmark?: () => void;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Load like and bookmark status when user is logged in
  const loadLikeStatus = async () => {
    if (user) {
      const res = await fetch(`/api/snippets/${snippet.id}/likes`);
      const data = await res.json();
      setIsLiked(data.userLiked);
    }
  };
  
  const loadBookmarkStatus = async () => {
    if (user) {
      const res = await fetch(`/api/snippets/${snippet.id}/bookmark`);
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    }
  };
  
  // Load statuses on mount and when user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLikeStatus();
    loadBookmarkStatus();
  }, [user, snippet.id]);
  
  // Mutations
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to like snippets",
          variant: "destructive"
        });
        return;
      }
      const res = await apiRequest("POST", `/api/snippets/${snippet.id}/like`);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippet.id}/likes`] });
    }
  });
  
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to bookmark snippets",
          variant: "destructive"
        });
        return;
      }
      const res = await apiRequest("POST", `/api/snippets/${snippet.id}/bookmark`);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    }
  });
  
  const formattedDate = snippet.createdAt 
    ? formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })
    : '';
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="py-4 px-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {snippet.language}
            </span>
            <span className="text-sm text-muted-foreground flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1" />
              {snippet.views}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              aria-label={isBookmarked ? "북마크 제거" : "북마크 추가"}
            >
              <BookmarkIcon
                className={cn(
                  "h-5 w-5",
                  isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              aria-label={isLiked ? "좋아요 취소" : "좋아요"}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isLiked ? "fill-primary text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
        <Link href={`/snippets/${snippet.id}`}>
          <h3 className="text-lg font-semibold mb-1 truncate hover:text-primary cursor-pointer">
            {snippet.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {snippet.description}
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        <SyntaxHighlighter
          code={snippet.code}
          language={snippet.language}
          showLanguageBadge={false}
        />
      </CardContent>
      
      <CardFooter className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={snippet.user.avatar || undefined} alt={snippet.user.username} />
            <AvatarFallback>{snippet.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-2">
            <p className="text-sm font-medium">{snippet.user.username}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 text-muted-foreground mr-1" />
          <span className="text-sm">0</span>
        </div>
      </CardFooter>
    </Card>
  );
}
