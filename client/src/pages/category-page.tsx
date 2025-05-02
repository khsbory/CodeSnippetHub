import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
import { useAuth } from "@/hooks/use-auth";

// Category-specific languages for filtering
const CATEGORY_LANGUAGES = {
  // 웹 카테고리 언어
  web: [
    { value: "all", label: "모든 언어" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue.js" },
    { value: "angular", label: "Angular" },
    { value: "nextjs", label: "Next.js" },
    { value: "svelte", label: "Svelte" },
    { value: "wai-aria", label: "WAI-ARIA" },
  ],
  
  // iOS 카테고리 언어
  ios: [
    { value: "all", label: "모든 언어" },
    { value: "swift", label: "Swift" },
    { value: "swiftui", label: "SwiftUI" },
    { value: "uikit", label: "UIKit" },
    { value: "objectivec", label: "Objective-C" },
    { value: "accessibility", label: "Accessibility API" },
    { value: "voiceover", label: "VoiceOver" },
  ],
  
  // Android 카테고리 언어
  android: [
    { value: "all", label: "모든 언어" },
    { value: "kotlin", label: "Kotlin" },
    { value: "java", label: "Java" },
    { value: "xml", label: "XML" },
    { value: "jetpackcompose", label: "Jetpack Compose" },
    { value: "viewbinding", label: "View Binding" },
    { value: "talkback", label: "TalkBack" },
  ]
};

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

import { usePageTitle } from "@/lib/usePageTitle";

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const PAGE_SIZE = 12;
  
  // Ref for infinite scroll observation
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 카테고리에 따라 타이틀 동적 설정
  const categoryTitle = {
    'web': '웹 접근성 코드',
    'ios': 'iOS 접근성 코드',
    'android': 'Android 접근성 코드',
  }[category as string] || `${category} 코드`;
  
  const categoryDescription = {
    'web': '웹 접근성을 향상시키는 HTML, CSS, JavaScript 코드 모음입니다.',
    'ios': 'iOS 앱의 접근성을 향상시키는 Swift 코드 모음입니다.',
    'android': 'Android 앱의 접근성을 향상시키는 Kotlin과 Java 코드 모음입니다.',
  }[category as string] || `${category} 관련 코드 모음입니다.`;
  
  usePageTitle(categoryTitle, categoryDescription);
  
  // Determine category display info
  const categoryInfo = CATEGORIES[category as keyof typeof CATEGORIES] || {
    title: `${category} 코드`,
    description: `${category} 관련 코드 모음입니다.`
  };
  
  // Fetch snippets with infinite scroll
  const { 
    data,
    isLoading, 
    isFetching,
    fetchNextPage, 
    hasNextPage 
  } = useInfiniteQuery({
    queryKey: ["/api/snippets", language, category],
    queryFn: async ({ queryKey, pageParam = 1 }) => {
      const [_, lang, cat] = queryKey as [string, string, string];
      const response = await fetch(`/api/snippets?language=${lang}&category=${cat}&page=${pageParam}&limit=${PAGE_SIZE}`);
      if (!response.ok) {
        throw new Error('Failed to fetch snippets');
      }
      const data = await response.json();
      return {
        snippets: data,
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !searchQuery.trim(), // Don't fetch when searching
  });
  
  // Fetch search results when search query changes, specific to this category
  const { data: searchResults, isLoading: isSearching } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/snippets/search", searchQuery, category],
    queryFn: async ({ queryKey }) => {
      const [_, query, cat] = queryKey;
      const response = await fetch(`/api/snippets/search?q=${query}&category=${cat}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search query will trigger the search query automatically
  };
  
  // All snippets flattened for infinite scroll
  const allSnippets = useMemo(() => {
    return data?.pages?.flatMap(page => page.snippets) || [];
  }, [data]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!searchQuery.trim() && loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      }, { threshold: 0.5 });
      
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreRef, hasNextPage, isFetching, fetchNextPage, searchQuery]);
  
  // Determine which data to display
  const displaySnippets = searchQuery.trim() ? (searchResults || []) : allSnippets;
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
                <label className="text-sm font-medium">언어</label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="언어 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_LANGUAGES[category as keyof typeof CATEGORY_LANGUAGES]?.map((lang: {value: string, label: string}) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    )) || CATEGORY_LANGUAGES.web.map((lang: {value: string, label: string}) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="ml-auto self-end">
                {user ? (
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    코드 공유하기
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/auth")}
                  >
                    로그인하고 코드 공유하기
                  </Button>
                )}
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
              ) : user ? (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  코드 공유하기
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  로그인하고 코드 공유하기
                </Button>
              )}
            </div>
          )}
          
          {/* 무한 스크롤 감지 영역 */}
          {!isLoadingData && !searchQuery.trim() && displaySnippets && displaySnippets.length > 0 && (
            <div ref={loadMoreRef} className="h-10 w-full mt-8"></div>
          )}

          {/* 무한 스크롤용 로딩 인디케이터 */}
          {isFetching && !isLoading && !searchQuery.trim() && (
            <div className="mt-8 text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">스니펫 로딩 중...</p>
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