import { useEffect } from 'react';

/**
 * 페이지 타이틀을 동적으로 변경하는 훅
 * 
 * @param title 페이지 타이틀 (접근성 코드 모음 | 이 자동으로 추가됨)
 * @param description meta description에 추가할 설명 (선택 사항)
 */
export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    // 이전 타이틀 저장
    const originalTitle = document.title;
    
    // 새 타이틀 설정
    document.title = `${title} | 접근성 코드 모음`;
    
    // 설명이 있으면 meta description 업데이트
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      const originalDescription = metaDescription?.getAttribute('content');
      
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        // meta 태그가 없으면 생성
        const newMeta = document.createElement('meta');
        newMeta.name = 'description';
        newMeta.content = description;
        document.head.appendChild(newMeta);
      }
      
      // 정리 함수에서 원래 description으로 복원
      return () => {
        if (metaDescription && originalDescription) {
          metaDescription.setAttribute('content', originalDescription);
        }
        document.title = originalTitle;
      };
    }
    
    // 정리 함수에서 원래 타이틀로 복원
    return () => {
      document.title = originalTitle;
    };
  }, [title, description]);
}