import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Eye, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { SnippetWithUser } from "@shared/schema";

interface SnippetCardProps {
  snippet: SnippetWithUser;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  const formattedDate = snippet.createdAt 
    ? formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })
    : '';
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="py-4 px-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900">
              {snippet.language}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1" />
              {snippet.views}
            </span>
            {snippet.category && (
              <span className="text-sm text-muted-foreground flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1" />
                {snippet.category}
              </span>
            )}
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
          snippetId={snippet.id}
          title={snippet.title}
        />
      </CardContent>
      
      <CardFooter className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={snippet.user?.avatar || undefined} alt={snippet.user?.username || '사용자'} />
            <AvatarFallback>
              {snippet.user?.username ? snippet.user.username.substring(0, 2).toUpperCase() : 'UN'}
            </AvatarFallback>
          </Avatar>
          <div className="ml-2">
            <p className="text-sm font-medium">{snippet.user?.username || '사용자'}</p>
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