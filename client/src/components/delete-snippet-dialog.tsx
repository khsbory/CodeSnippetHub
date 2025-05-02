import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface DeleteSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippetId: number;
  snippetTitle: string;
}

export function DeleteSnippetDialog({ open, onOpenChange, snippetId, snippetTitle }: DeleteSnippetDialogProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // 이 함수는 다이얼로그가 닫힐 때 포커스를 삭제 버튼으로 돌려보내는 역할을 합니다
  useEffect(() => {
    if (!open) {
      // 다이얼로그가 닫힐 때 삭제 버튼에 포커스를 이동
      const deleteButton = document.querySelector('[aria-label="스니펫 삭제"]');
      if (deleteButton && deleteButton instanceof HTMLElement) {
        setTimeout(() => {
          deleteButton.focus();
        }, 0);
      }
    }
  }, [open]);
  
  // Delete snippet mutation
  const deleteSnippetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/snippets/${snippetId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "스니펫 삭제 완료",
        description: "코드 스니펫이 성공적으로 삭제되었습니다!",
      });
      onOpenChange(false);
      // Redirect to home page after deletion
      navigate("/");
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
    },
    onError: (error) => {
      toast({
        title: "스니펫 삭제 오류",
        description: error.message || "삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      onOpenChange(false);
    },
  });
  
  const handleDelete = () => {
    deleteSnippetMutation.mutate();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>스니펫 삭제</DialogTitle>
          <DialogDescription>
            정말로 "{snippetTitle}" 스니펫을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteSnippetMutation.isPending}
          >
            {deleteSnippetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}