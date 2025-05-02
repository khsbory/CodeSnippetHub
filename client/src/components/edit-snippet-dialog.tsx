import { useState, useEffect } from "react";
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
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Loader2 } from "lucide-react";
import { SnippetWithUser } from "@shared/schema";

// 카테고리별 언어 분류
const CATEGORY_LANGUAGES = {
  // 웹 카테고리 언어
  web: [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "jsx", label: "JSX" },
    { value: "tsx", label: "TSX" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "scss", label: "SCSS" },
  ],
  
  // iOS 카테고리 언어
  ios: [
    { value: "swift", label: "Swift" },
    { value: "swiftui", label: "SwiftUI" },
    { value: "objective-c", label: "Objective-C" },
  ],
  
  // Android 카테고리 언어
  android: [
    { value: "kotlin", label: "Kotlin" },
    { value: "java", label: "Java" },
    { value: "jetpack-compose", label: "Jetpack Compose" },
    { value: "xml", label: "XML" },
  ]
};

// 카테고리 목록 정의
const CATEGORIES = [
  { value: "web", label: "웹 (Web)" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "안드로이드 (Android)" },
];

// Form validation schema
const editSnippetSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().optional(),
  language: z.string().min(1, "Please select a language"),
  category: z.string().min(1, "Please select a category"),
  code: z.string().min(1, "Code is required"),
});

type EditSnippetFormValues = z.infer<typeof editSnippetSchema>;

interface EditSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippet: SnippetWithUser;
}

export function EditSnippetDialog({ open, onOpenChange, snippet }: EditSnippetDialogProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>(snippet.category);
  
  // 이 함수는 다이얼로그가 닫힐 때 포커스를 편집 버튼으로 돌려보내는 역할을 합니다
  useEffect(() => {
    if (!open) {
      // 다이얼로그가 닫힐 때 편집 버튼에 포커스를 이동
      const editButton = document.querySelector('[aria-label="스니펫 편집"]');
      if (editButton && editButton instanceof HTMLElement) {
        setTimeout(() => {
          editButton.focus();
        }, 0);
      }
    }
  }, [open]);
  
  // Initialize form with snippet values
  const form = useForm<EditSnippetFormValues>({
    resolver: zodResolver(editSnippetSchema),
    defaultValues: {
      title: snippet.title,
      description: snippet.description || "",
      language: snippet.language,
      category: snippet.category,
      code: snippet.code,
    },
  });
  
  // Update snippet mutation
  const updateSnippetMutation = useMutation({
    mutationFn: async (values: EditSnippetFormValues) => {
      const snippetData = {
        title: values.title,
        description: values.description || "",
        language: values.language,
        category: values.category,
        code: values.code,
      };
      
      const res = await apiRequest("PUT", `/api/snippets/${snippet.id}`, snippetData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "스니펫 수정 완료",
        description: "코드 스니펫이 성공적으로 수정되었습니다!",
      });
      // Reset form and close dialog
      onOpenChange(false);
      // Refresh snippet data
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippet.id}`] });
    },
    onError: (error) => {
      toast({
        title: "스니펫 수정 오류",
        description: error.message || "수정 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: EditSnippetFormValues) => {
    updateSnippetMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>스니펫 수정</DialogTitle>
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
                    <div className="border rounded-md overflow-hidden">
                      <CKEditor
                        editor={ClassicEditor}
                        data={field.value}
                        onChange={(_, editor) => {
                          const data = editor.getData();
                          field.onChange(data);
                        }}
                        config={{
                          toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
                          placeholder: "코드가 무엇을 하는지 설명해주세요",
                        }}
                      />
                    </div>
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
                disabled={updateSnippetMutation.isPending}
              >
                {updateSnippetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    수정 중...
                  </>
                ) : "스니펫 수정"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}