import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SnippetWithUser } from "@shared/schema";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CreateSnippetDialog } from "@/components/create-snippet-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Languages supported for filtering
const LANGUAGES = [
  { value: "all", label: "All Languages" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
];

export default function HomePage() {
  const [filter, setFilter] = useState("latest");
  const [language, setLanguage] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Fetch snippets with filter and language
  const { data: snippets, isLoading, isFetching, fetchNextPage, hasNextPage } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets", filter, language],
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero section */}
          <section className="mb-8 text-center py-8 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <h1 className="text-3xl font-bold mb-3">Share Code Snippets with the World</h1>
            <p className="text-lg mb-6 max-w-2xl mx-auto">Create, discover, and learn from code snippets shared by developers around the globe.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-md hover:bg-gray-100 shadow-md transition"
                size="lg"
              >
                Create Snippet
              </Button>
              <Button
                variant="outline"
                className="px-6 py-3 bg-indigo-700 text-white font-medium rounded-md hover:bg-indigo-800 shadow-md transition"
                size="lg"
              >
                Explore Snippets
              </Button>
            </div>
          </section>

          {/* Filter and language selection */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setFilter("latest")}
                variant={filter === "latest" ? "default" : "outline"}
                className="px-4 py-2 rounded-md"
              >
                Latest
              </Button>
              <Button
                onClick={() => setFilter("popular")}
                variant={filter === "popular" ? "default" : "outline"}
                className="px-4 py-2 rounded-md"
              >
                Popular
              </Button>
              <Button
                onClick={() => setFilter("trending")}
                variant={filter === "trending" ? "default" : "outline"}
                className="px-4 py-2 rounded-md"
              >
                Trending
              </Button>
            </div>
            
            <div className="relative">
              <Select
                value={language}
                onValueChange={setLanguage}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Snippets grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : snippets && snippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {snippets.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl font-semibold mb-4">No snippets found</p>
              <p className="text-muted-foreground mb-6">
                {language !== 'all' 
                  ? `No ${language} snippets available. Try another language or be the first to share one!`
                  : "No snippets available yet. Be the first to share your code!"}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create Snippet
              </Button>
            </div>
          )}

          {/* Load more button */}
          {!isLoading && snippets && snippets.length > 0 && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetching || !hasNextPage}
                className="px-6 py-3"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Snippets"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <CreateSnippetDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {/* Mobile create button (fixed) */}
      <div className="sm:hidden fixed bottom-4 right-4 z-20">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <span className="text-xl">+</span>
        </Button>
      </div>
    </div>
  );
}
