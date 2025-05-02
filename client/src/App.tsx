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
import CategoryPage from "@/pages/category-page";
import SnippetDetailPage from "@/pages/snippet-detail-page";
import UserProfilePage from "@/pages/user-profile-page";
import MySnippetsPage from "@/pages/my-snippets-page";
import SearchResultsPage from "@/pages/search-results-page";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import "@/styles/prism-theme.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/category/:category" component={CategoryPage} />
      <Route path="/snippets/:id" component={SnippetDetailPage} />
      <Route path="/users/:id" component={UserProfilePage} />
      <Route path="/search" component={SearchResultsPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/my-snippets" component={MySnippetsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
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
