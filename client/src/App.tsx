import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SnippetDetailPage from "@/pages/snippet-detail-page";
import UserProfilePage from "@/pages/user-profile-page";
import MySnippetsPage from "@/pages/my-snippets-page";
import BookmarksPage from "@/pages/bookmarks-page";
import ExplorePage from "@/pages/explore-page";
import SearchResultsPage from "@/pages/search-results-page";
import "@/styles/prism-theme.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/snippets/:id" component={SnippetDetailPage} />
      <Route path="/users/:id" component={UserProfilePage} />
      <Route path="/search" component={SearchResultsPage} />
      <ProtectedRoute path="/my-snippets" component={MySnippetsPage} />
      <ProtectedRoute path="/bookmarks" component={BookmarksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="theme-preference">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
