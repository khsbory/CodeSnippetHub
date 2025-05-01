import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { CreateSnippetDialog } from "@/components/create-snippet-dialog";
import { SearchDialog } from "@/components/search-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTrigger
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/use-auth";
import { 
  Code, 
  Search, 
  Menu, 
  Plus, 
  User, 
  Bookmark, 
  Cog, 
  LogOut, 
  ShieldAlert 
} from "lucide-react";

export function Header() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createSnippetOpen, setCreateSnippetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const navigation = [
    { name: "홈", href: "/" },
    { name: "탐색", href: "/explore" },
    { name: "내 스니펫", href: "/my-snippets" },
    { name: "북마크", href: "/bookmarks" },
  ];
  
  const isActiveRoute = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleCreateSnippetClick = () => {
    if (!user) {
      // 로그인이 안 되어 있으면 로그인 페이지로 이동
      setLocation("/auth?tab=login");
    } else {
      // 로그인이 되어 있으면 스니펫 생성 다이얼로그 열기
      setCreateSnippetOpen(true);
    }
  };
  
  return (
    <header className="bg-background sticky top-0 z-30 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Code className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-lg">코드 스니펫 허브</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActiveRoute(item.href)
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="text-muted-foreground"
              aria-label="검색"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Dark Mode Toggle */}
            <DarkModeToggle />
            
            {/* Create Snippet Button (Desktop) */}
            <Button
              onClick={handleCreateSnippetClick}
              className="ml-4 hidden sm:flex items-center"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> 스니펫 생성
            </Button>
            
            {/* User Menu (Authenticated) */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-4 h-8 w-8 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${user.id}`} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> 프로필
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-snippets" className="cursor-pointer">
                      <Code className="h-4 w-4 mr-2" /> 내 스니펫
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="cursor-pointer">
                      <Bookmark className="h-4 w-4 mr-2" /> 북마크
                    </Link>
                  </DropdownMenuItem>
                  {/* 관리자 메뉴 */}
                  {user.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>관리자</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <ShieldAlert className="h-4 w-4 mr-2" /> 관리자 페이지
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> 로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Login/Signup Buttons (Not Authenticated) */
              <div className="ml-4 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium"
                  asChild
                >
                  <a href="/auth?tab=login">로그인</a>
                </Button>
                <Button
                  className="ml-2 text-sm font-medium"
                  size="sm"
                  asChild
                >
                  <a href="/auth?tab=register">회원가입</a>
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 sm:hidden"
                  aria-label="메뉴 열기"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="py-4 px-4">
                  <nav className="flex flex-col space-y-1">
                    {navigation.map((item) => (
                      <DrawerClose asChild key={item.name}>
                        <Link
                          href={item.href}
                          className={`px-3 py-2 rounded-md text-base font-medium ${
                            isActiveRoute(item.href)
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </DrawerClose>
                    ))}
                    
                    {/* 관리자 메뉴 - 모바일 */}
                    {user && user.isAdmin && (
                      <DrawerClose asChild>
                        <Link
                          href="/admin"
                          className={`px-3 py-2 rounded-md text-base font-medium ${
                            isActiveRoute("/admin")
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <ShieldAlert className="h-4 w-4 mr-2 inline-block" /> 관리자 페이지
                        </Link>
                      </DrawerClose>
                    )}
                    
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleCreateSnippetClick();
                      }}
                      className="mt-3 w-full justify-center"
                    >
                      <Plus className="h-4 w-4 mr-1" /> 스니펫 생성
                    </Button>
                  </nav>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
      
      {/* Create Snippet Dialog */}
      <CreateSnippetDialog 
        open={createSnippetOpen} 
        onOpenChange={setCreateSnippetOpen} 
      />
      
      {/* Search Dialog */}
      <SearchDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
      />
    </header>
  );
}
