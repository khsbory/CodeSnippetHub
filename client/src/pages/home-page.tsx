import { useState, useRef, useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SnippetWithUser } from "@shared/schema";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/lib/usePageTitle";
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

// 카테고리별 언어 분류
const CATEGORIES = {
  web: [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "jsx", label: "JSX" },
    { value: "tsx", label: "TSX" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "scss", label: "SCSS" },
  ],
  ios: [
    { value: "swift", label: "Swift" },
    { value: "swiftui", label: "SwiftUI" },
    { value: "objective-c", label: "Objective-C" },
  ],
  android: [
    { value: "kotlin", label: "Kotlin" },
    { value: "java", label: "Java" },
    { value: "jetpack-compose", label: "Jetpack Compose" },
    { value: "xml", label: "XML" },
  ],
};

// 모든 언어 리스트
const LANGUAGES = [
  { value: "all", label: "모든 언어" },
  ...CATEGORIES.web,
  ...CATEGORIES.ios,
  ...CATEGORIES.android,
];

export default function HomePage() {
  usePageTitle("홈", "접근성 코드 모음 - 웹, iOS, Android 접근성 구현 코드 모음입니다.");
  
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const PAGE_SIZE = 12;

  // Ref for infinite scroll observation
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Fetch snippets with language, category, pagination
  const { 
    data, 
    isLoading, 
    isFetching, 
    fetchNextPage, 
    hasNextPage 
  } = useInfiniteQuery({
    queryKey: ["/api/snippets", language, "all"],
    queryFn: async ({ queryKey, pageParam = 1 }) => {
      const [_, lang, category] = queryKey as [string, string, string];
      const response = await fetch(`/api/snippets?language=${lang}&category=${category}&page=${pageParam}&limit=${PAGE_SIZE}`);
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
  });
  
  // All snippets flattened
  const allSnippets = useMemo(() => {
    return data?.pages?.flatMap(page => page.snippets) || [];
  }, [data]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loadMoreRef.current) {
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
  }, [loadMoreRef, hasNextPage, isFetching, fetchNextPage]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero section */}
          <section className="mb-8 text-center py-8 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <h1 className="text-3xl font-bold mb-3">접근성 코드 모음</h1>
            <p className="text-lg mb-6 max-w-2xl mx-auto">접근성 구현 코드를 배워 보세요.</p>
            {user && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-md hover:bg-gray-100 shadow-md transition"
                size="lg"
              >
                스니펫 생성
              </Button>
            )}
          </section>

          {/* Language selection */}
          <div className="mb-6 flex justify-end">
            <div className="relative">
              <Select
                value={language}
                onValueChange={setLanguage}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 언어</SelectItem>
                  
                  <div className="px-2 py-1.5 text-xs font-semibold">웹</div>
                  {CATEGORIES.web.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                  
                  <div className="px-2 py-1.5 text-xs font-semibold mt-1">iOS</div>
                  {CATEGORIES.ios.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                  
                  <div className="px-2 py-1.5 text-xs font-semibold mt-1">Android</div>
                  {CATEGORIES.android.map((lang) => (
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
          ) : allSnippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allSnippets.map((snippet: SnippetWithUser) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl font-semibold mb-4">스니펫을 찾을 수 없습니다</p>
              <p className="text-muted-foreground mb-6">
                {language !== 'all' 
                  ? `${LANGUAGES.find(lang => lang.value === language)?.label} 스니펫이 없습니다. 다른 언어를 시도하거나 첫 번째로 공유해보세요!`
                  : "아직 스니펫이 없습니다. 첫 번째로 코드를 공유해보세요!"}
              </p>
              {user && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  스니펫 생성
                </Button>
              )}
            </div>
          )}

          {/* 무한 스크롤 감지 영역 */}
          {!isLoading && allSnippets.length > 0 && (
            <div ref={loadMoreRef} className="h-10 w-full mt-8"></div>
          )}

          {/* 무한 스크롤용 로딩 인디케이터 */}
          {isFetching && !isLoading && (
            <div className="mt-8 text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">스니펫 로딩 중...</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <CreateSnippetDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {/* Mobile create button (fixed) - only for logged-in users */}
      {user && (
        <div className="sm:hidden fixed bottom-4 right-4 z-20">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <span className="text-xl">+</span>
          </Button>
        </div>
      )}
    </div>
  );
}