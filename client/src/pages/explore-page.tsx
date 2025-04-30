import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { SnippetWithUser } from "@shared/schema";
import { CreateSnippetDialog } from "@/components/create-snippet-dialog";

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
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("latest");
  const [language, setLanguage] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Fetch snippets with filter and language
  const { data: snippets, isLoading, isFetching, fetchNextPage, hasNextPage } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets", filter, language],
    enabled: !searchQuery, // Don't fetch when searching
  });
  
  // Fetch search results when search query changes
  const { data: searchResults, isLoading: isSearching } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets/search", searchQuery],
    enabled: !!searchQuery.trim(),
  });
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search query will trigger the search query automatically
  };
  
  // Determine which data to display
  const displaySnippets = searchQuery.trim() ? searchResults : snippets;
  const isLoadingData = searchQuery.trim() ? isSearching : isLoading;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter Section */}
          <div className="bg-card rounded-lg p-6 border mb-8">
            <h1 className="text-2xl font-bold mb-4">Explore Code Snippets</h1>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search snippets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setFilter("latest")}
                    variant={filter === "latest" ? "default" : "outline"}
                    size="sm"
                  >
                    Latest
                  </Button>
                  <Button
                    onClick={() => setFilter("popular")}
                    variant={filter === "popular" ? "default" : "outline"}
                    size="sm"
                  >
                    Popular
                  </Button>
                  <Button
                    onClick={() => setFilter("trending")}
                    variant={filter === "trending" ? "default" : "outline"}
                    size="sm"
                  >
                    Trending
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
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
              
              <div className="ml-auto self-end">
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Share Snippet
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search Results Heading */}
          {searchQuery.trim() && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                {isSearching 
                  ? "Searching..." 
                  : searchResults?.length 
                    ? `Search results for "${searchQuery}"` 
                    : `No results found for "${searchQuery}"`}
              </h2>
            </div>
          )}
          
          {/* Snippets Grid */}
          {isLoadingData ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : displaySnippets && displaySnippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displaySnippets.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No snippets found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery.trim() 
                  ? "Try a different search term or browse all snippets."
                  : `No ${language !== 'all' ? language + ' ' : ''}snippets available. Be the first to share one!`}
              </p>
              {searchQuery.trim() ? (
                <Button onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              ) : (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Create Snippet
                </Button>
              )}
            </div>
          )}
          
          {/* Load More Button */}
          {!isLoadingData && displaySnippets && displaySnippets.length > 0 && !searchQuery.trim() && (
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
      
      {/* Create Snippet Dialog */}
      <CreateSnippetDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
}
