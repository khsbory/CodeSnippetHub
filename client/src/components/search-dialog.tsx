import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SnippetWithUser } from "@shared/schema";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);
  
  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(s => s !== query)
    ].slice(0, 5); // Keep only 5 recent searches
    
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };
  
  // Handle search submission
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    saveSearch(query);
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    onOpenChange(false);
  };
  
  // Remove a search from history
  const removeSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSearches = recentSearches.filter(s => s !== search);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };
  
  // Fetch trending tags (most used languages)
  const { data: trendingSnippets, isLoading } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets", "latest"],
    enabled: open,
  });
  
  // Extract unique languages from trending snippets
  const trendingLanguages = trendingSnippets 
    ? Array.from(new Set(trendingSnippets.map(snippet => snippet.language)))
    : [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for code snippets, users, or tags..."
            className="pl-10 pr-4 py-6"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchQuery);
              }
            }}
          />
        </div>
        
        {/* Recent Searches */}
        <div>
          <h3 className="text-sm font-medium mb-1">Recent Searches</h3>
          {recentSearches.length > 0 ? (
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search);
                  }}
                >
                  <div className="flex items-center">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm">{search}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => removeSearch(search, e)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No recent searches</p>
          )}
        </div>
        
        {/* Trending Tags/Languages */}
        <div>
          <h3 className="text-sm font-medium mb-1">Trending Languages</h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendingLanguages.map((language, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setLocation(`/snippets?language=${language}`);
                    onOpenChange(false);
                  }}
                >
                  {language}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
