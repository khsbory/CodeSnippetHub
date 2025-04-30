import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SnippetCard } from "@/components/snippet-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { CreateSnippetDialog } from "@/components/create-snippet-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SnippetWithUser } from "@shared/schema";

export default function MySnippetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<number | null>(null);
  
  // Fetch user's snippets
  const { data: mySnippets, isLoading: isLoadingSnippets } = useQuery<SnippetWithUser[]>({
    queryKey: ["/api/users", user?.id, "snippets"],
    enabled: !!user,
  });
  
  // Delete snippet mutation
  const deleteMutation = useMutation({
    mutationFn: async (snippetId: number) => {
      await apiRequest("DELETE", `/api/snippets/${snippetId}`);
    },
    onSuccess: () => {
      toast({
        title: "Snippet deleted",
        description: "Your snippet has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "snippets"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting snippet",
        description: error.message || "There was an error deleting your snippet",
        variant: "destructive",
      });
    },
  });
  
  // Handle snippet delete confirmation
  const confirmDelete = (snippetId: number) => {
    setSnippetToDelete(snippetId);
    setDeleteDialogOpen(true);
  };
  
  // Execute snippet deletion
  const handleDelete = () => {
    if (snippetToDelete !== null) {
      deleteMutation.mutate(snippetToDelete);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Snippets</h1>
              <p className="text-muted-foreground">Manage all your code snippets</p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Snippet
            </Button>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Snippets</TabsTrigger>
              <TabsTrigger value="draft" disabled>Drafts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoadingSnippets ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : mySnippets && mySnippets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySnippets.map(snippet => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      onDelete={() => confirmDelete(snippet.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">No snippets yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't created any code snippets yet. Share your first snippet with the community!
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create Your First Snippet
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      
      {/* Create Snippet Dialog */}
      <CreateSnippetDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this snippet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
