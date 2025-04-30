import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SnippetWithUser } from "@shared/schema";
import { useLocation } from "wouter";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch user's bookmarked snippets
  const { data: bookmarkedSnippets, isLoading } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Bookmarks</h1>
            <p className="text-muted-foreground">Code snippets you've saved for later</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : bookmarkedSnippets && bookmarkedSnippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedSnippets.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't bookmarked any code snippets yet. Browse snippets and bookmark the ones you find useful!
              </p>
              <Button onClick={() => navigate("/explore")}>
                Explore Snippets
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
