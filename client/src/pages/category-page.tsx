import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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
  { value: "all", label: "모든 언어" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "objectivec", label: "Objective-C" },
];

// Category info mapping
const CATEGORIES = {
  web: { 
    title: "웹 접근성 코드",
    description: "웹 접근성을 향상시키는 HTML, CSS, JavaScript 코드 모음입니다."
  },
  ios: { 
    title: "iOS 접근성 코드",
    description: "iOS 앱의 접근성을 향상시키는 Swift 코드 모음입니다."
  },
  android: { 
    title: "Android 접근성 코드",
    description: "Android 앱의 접근성을 향상시키는 Kotlin과 Java 코드 모음입니다."
  }
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("latest");
  const [language, setLanguage] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Determine category display info
  const categoryInfo = CATEGORIES[category as keyof typeof CATEGORIES] || {
    title: `${category} 코드`,
    description: `${category} 관련 코드 모음입니다.`
  };
  
  // Fetch snippets with filter, language, and category
  const { data: snippets, isLoading, isFetching } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets", filter, language, category],
    enabled: !searchQuery, // Don't fetch when searching
  });
  
  // Fetch search results when search query changes
  const { data: searchResults, isLoading: isSearching } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets/search", searchQuery, category],
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
          {/* Title and Description */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{categoryInfo.title}</h1>
            <p className="text-muted-foreground mt-2">{categoryInfo.description}</p>
          </div>
          
          {/* Search and Filter Section */}
          <div className="bg-card rounded-lg p-6 border mb-8">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="코드 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">검색</Button>
            </form>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">정렬</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setFilter("latest")}
                    variant={filter === "latest" ? "default" : "outline"}
                    size="sm"
                  >
                    최신순
                  </Button>
                  <Button
                    onClick={() => setFilter("popular")}
                    variant={filter === "popular" ? "default" : "outline"}
                    size="sm"
                  >
                    인기순
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">언어</label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="언어 선택" />
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
                  코드 공유하기
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search Results Heading */}
          {searchQuery.trim() && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                {isSearching 
                  ? "검색 중..." 
                  : searchResults?.length 
                    ? `"${searchQuery}" 검색 결과` 
                    : `"${searchQuery}"에 대한 결과가 없습니다`}
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
              <h3 className="text-xl font-semibold mb-2">코드를 찾을 수 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery.trim() 
                  ? "다른 검색어로 시도하거나 전체 코드를 둘러보세요."
                  : `${language !== 'all' ? language + ' ' : ''}${category} 카테고리에 코드가 없습니다. 첫 번째로 공유해 보세요!`}
              </p>
              {searchQuery.trim() ? (
                <Button onClick={() => setSearchQuery("")}>
                  검색 초기화
                </Button>
              ) : (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  코드 공유하기
                </Button>
              )}
            </div>
          )}
          

        </div>
      </main>
      <Footer />
      
      {/* Create Snippet Dialog */}
      <CreateSnippetDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        defaultCategory={category}
      />
    </div>
  );
}