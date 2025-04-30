import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { SnippetWithUser } from "@shared/schema";

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

export default function SearchResultsPage() {
  const [, navigate] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [language, setLanguage] = useState("all");
  
  // Fetch search results
  const { data: searchResults, isLoading } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets/search", searchQuery],
    enabled: !!searchQuery.trim(),
  });
  
  // Update search query when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [window.location.search]);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };
  
  // Filter results by language
  const filteredResults = searchResults && language !== "all"
    ? searchResults.filter(snippet => snippet.language === language)
    : searchResults;
  
  // Track if no results for the selected language
  const noLanguageResults = searchResults?.length && filteredResults?.length === 0;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold mb-4">Search Results</h1>
            
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
          </div>
          
          {/* Filter Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 p-4 bg-card rounded-lg border">
            <div>
              {!isLoading && searchResults && (
                <p className="text-sm text-muted-foreground">
                  Found {filteredResults?.length} results for "{searchQuery}"
                </p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Filter by language</label>
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
          
          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredResults && filteredResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                {noLanguageResults 
                  ? `No results found for "${searchQuery}" in ${language} language. Try a different language filter.`
                  : `No results found for "${searchQuery}". Try a different search term.`}
              </p>
              {noLanguageResults ? (
                <Button onClick={() => setLanguage("all")}>
                  Show All Languages
                </Button>
              ) : (
                <Button onClick={() => navigate("/explore")}>
                  Explore Snippets
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
