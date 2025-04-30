import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User, SnippetWithUser } from "@shared/schema";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id);
  
  // Fetch user data
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
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
              <TabsTrigger value="snippets">Snippets</TabsTrigger>
              <TabsTrigger value="liked" disabled>Liked</TabsTrigger>
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
                  <h3 className="text-xl font-semibold mb-2">No snippets yet</h3>
                  <p className="text-muted-foreground">
                    This user hasn't shared any code snippets yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
