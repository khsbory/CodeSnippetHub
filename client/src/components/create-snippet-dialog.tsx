import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Languages supported for syntax highlighting
const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "php", label: "PHP" },
  { value: "markup", label: "HTML" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
];

// Form validation schema
const createSnippetSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().optional(),
  language: z.string().min(1, "Please select a language"),
  code: z.string().min(1, "Code is required"),
  tags: z.string().optional(),
});

type CreateSnippetFormValues = z.infer<typeof createSnippetSchema>;

interface CreateSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSnippetDialog({ open, onOpenChange }: CreateSnippetDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<CreateSnippetFormValues>({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: {
      title: "",
      description: "",
      language: "javascript",
      code: "",
      tags: "",
    },
  });
  
  // Create snippet mutation
  const createSnippetMutation = useMutation({
    mutationFn: async (values: CreateSnippetFormValues) => {
      const snippetData = {
        title: values.title,
        description: values.description || "",
        language: values.language,
        code: values.code,
        // Tags would be handled separately in a production app
      };
      
      const res = await apiRequest("POST", "/api/snippets", snippetData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Snippet created",
        description: "Your code snippet has been successfully created!",
      });
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      // Refresh snippets list
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating snippet",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: CreateSnippetFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create snippets",
        variant: "destructive",
      });
      return;
    }
    
    createSnippetMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>새 코드 스니펫 생성</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="스니펫의 제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로그래밍 언어</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="프로그래밍 언어 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={8}>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>코드</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="여기에 코드를 붙여넣으세요"
                      className="font-mono text-sm h-40 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="코드가 무엇을 하는지 설명해주세요"
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. algorithm, data-structure, function (comma separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createSnippetMutation.isPending}
              >
                {createSnippetMutation.isPending ? "Creating..." : "Create Snippet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
