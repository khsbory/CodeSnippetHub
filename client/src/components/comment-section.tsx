import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CommentWithUser } from "@shared/schema";
import { Trash2 } from "lucide-react";

const commentSchema = z.object({
  content: z.string().min(3, "Comment must be at least 3 characters").max(500, "Comment must be at most 500 characters"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentSectionProps {
  snippetId: number;
}

export function CommentSection({ snippetId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Fetch comments for this snippet
  const { data: comments, isLoading } = useQuery<CommentWithUser[]>({
    queryKey: [`/api/snippets/${snippetId}/comments`],
  });
  
  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (values: CommentFormValues) => {
      const commentData = {
        content: values.content,
        snippetId,
      };
      
      const res = await apiRequest("POST", "/api/comments", commentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippetId}/comments`] });
    },
    onError: (error) => {
      toast({
        title: "Error adding comment",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippetId}/comments`] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting comment",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: CommentFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post comments",
        variant: "destructive",
      });
      return;
    }
    
    createCommentMutation.mutate(values);
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Comments</h3>
      
      {/* Comment Form */}
      {user && (
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add a comment..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={createCommentMutation.isPending}
                  >
                    {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
      
      {!user && (
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-muted-foreground">Please log in to post comments</p>
        </div>
      )}
      
      <Separator />
      
      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
                <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{comment.user.username}</h4>
                    <p className="text-xs text-muted-foreground">
                      {comment.createdAt 
                        ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                        : ''}
                    </p>
                  </div>
                  {user && user.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
