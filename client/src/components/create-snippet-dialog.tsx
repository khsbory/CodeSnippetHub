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

// Category-specific languages for syntax highlighting
const CATEGORY_LANGUAGES = {
  // 웹 카테고리 언어
  web: [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "jsx", label: "JSX" },
    { value: "tsx", label: "TSX" },
    { value: "css", label: "CSS" },
    { value: "scss", label: "SCSS" },
    { value: "html", label: "HTML" },
    { value: "markup", label: "Markup/HTML" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue.js" },
    { value: "angular", label: "Angular" },
    { value: "nextjs", label: "Next.js" },
    { value: "svelte", label: "Svelte" },
    { value: "wai-aria", label: "WAI-ARIA" },
  ],
  
  // iOS 카테고리 언어
  ios: [
    { value: "swift", label: "Swift" },
    { value: "swiftui", label: "SwiftUI" },
    { value: "uikit", label: "UIKit" },
    { value: "objectivec", label: "Objective-C" },
    { value: "accessibility", label: "Accessibility API" },
    { value: "voiceover", label: "VoiceOver" },
  ],
  
  // Android 카테고리 언어
  android: [
    { value: "kotlin", label: "Kotlin" },
    { value: "java", label: "Java" },
    { value: "xml", label: "XML" },
    { value: "jetpackcompose", label: "Jetpack Compose" },
    { value: "viewbinding", label: "View Binding" },
    { value: "talkback", label: "TalkBack" },
  ]
};

// 카테고리 목록 정의
const CATEGORIES = [
  { value: "web", label: "웹 (Web)" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "안드로이드 (Android)" },
];

// Form validation schema
const createSnippetSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().optional(),
  language: z.string().min(1, "Please select a language"),
  category: z.string().min(1, "Please select a category"),
  code: z.string().min(1, "Code is required"),
  tags: z.string().optional(),
});

type CreateSnippetFormValues = z.infer<typeof createSnippetSchema>;

interface CreateSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
}

export function CreateSnippetDialog({ open, onOpenChange, defaultCategory = "web" }: CreateSnippetDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  
  // Initialize form with default values
  const form = useForm<CreateSnippetFormValues>({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: {
      title: "",
      description: "",
      language: selectedCategory === "web" ? "javascript" : 
                selectedCategory === "ios" ? "swift" : 
                selectedCategory === "android" ? "kotlin" : "javascript",
      category: defaultCategory,
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
        category: values.category,
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCategory(value);
                      
                      // 카테고리 변경 시 해당 카테고리의 첫 번째 언어로 기본값 설정
                      const defaultLanguage = 
                        value === 'web' ? 'javascript' :
                        value === 'ios' ? 'swift' :
                        value === 'android' ? 'kotlin' : 'javascript';
                      
                      form.setValue('language', defaultLanguage);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={8}>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
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
                      {CATEGORY_LANGUAGES[selectedCategory as keyof typeof CATEGORY_LANGUAGES]?.map((language: {value: string, label: string}) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      )) || CATEGORY_LANGUAGES.web.map((language: {value: string, label: string}) => (
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
                  <FormLabel>태그 (선택사항)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: 알고리즘, 자료구조, 함수 (쉼표로 구분)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">취소</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createSnippetMutation.isPending}
              >
                {createSnippetMutation.isPending ? "생성 중..." : "스니펫 생성"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
