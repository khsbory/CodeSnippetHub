import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Eye } from "lucide-react";
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {snippet.language}
            </span>
            <span className="text-sm text-muted-foreground flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1" />
              {snippet.views}
            </span>
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
