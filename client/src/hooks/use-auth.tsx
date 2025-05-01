import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type RegisterResponse = {
  needVerification?: boolean;
  message?: string;
  username?: string;
} & Partial<Omit<User, 'password'>>;

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, RegisterData>;
};

// 로그인은 이메일과 비밀번호만 필요
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
type LoginData = z.infer<typeof loginSchema>;

// 회원가입은 이메일, 비밀번호만 필요하고 사용자 이름은 백엔드에서 자동 생성
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  username: z.string().optional() // 백엔드에서 자동 생성하므로 선택적
});
type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, 'password'> | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<User, 'password'>) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "로그인 성공",
        description: `${user.username}님, 다시 환영합니다!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (response: any) => {
      // needVerification이 true면 사용자를 로그인 상태로 설정하지 않음
      if (response.needVerification) {
        // 사용자 상태를 업데이트하지 않고 이메일 인증 필요 메시지만 표시
        toast({
          title: "이메일 인증이 필요합니다",
          description: `${response.username}님, 이메일 인증 후 로그인해주세요.`,
        });
      } else {
        // 기존 로직: 인증이 필요 없는 경우 바로 로그인 상태로 설정
        queryClient.setQueryData(["/api/user"], response);
        toast({
          title: "회원가입 성공",
          description: `${response.username}님, 환영합니다!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "로그아웃",
        description: "성공적으로 로그아웃 되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "로그아웃 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
