import { useEffect, useState } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Github, Twitter, Loader2, Code, Mail, LockKeyhole, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema as apiLoginSchema } from "@shared/schema";

// 클라이언트용 로그인 스키마 (rememberMe 옵션 추가)
const loginSchema = apiLoginSchema.extend({
  rememberMe: z.boolean().optional(),
});

// 클라이언트용 회원가입 스키마 (이메일 회원가입 + 약관 동의)
const registerSchema = z.object({
  email: z.string()
    .email("유효한 이메일 주소를 입력해주세요"),
  fullName: z.string()
    .min(2, "이름은 최소 2자 이상이어야 합니다")
    .max(50, "이름이 너무 깁니다"),
  password: z.string()
    .min(6, "비밀번호는 최소 6자 이상이어야 합니다")
    .max(100, "비밀번호가 너무 깁니다"),
  confirmPassword: z.string()
    .min(1, "비밀번호 확인을 입력해주세요"),
  acceptTerms: z.boolean().refine(val => val, {
    message: "이용약관에 동의해주세요",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultTab = params.get("tab") === "register" ? "register" : "login";
  
  // 인증 이메일 발송 상태 관리
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // 로그인 폼
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // 회원가입 폼
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      email: values.email,
      password: values.password
    });
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      username: values.email.split('@')[0], // 이메일에서 사용자 이름 자동 생성
      email: values.email,
      password: values.password,
      fullName: values.fullName, // 성명 필드 추가
    }, {
      onSuccess: (response) => {
        // 인증 이메일 발송 여부 확인하고 UI 업데이트
        setVerificationSent(true);
      }
    });
  };

  // 로딩 중에는 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row rounded-xl overflow-hidden shadow-lg max-w-6xl mx-auto">
            {/* Auth Forms */}
            <div className="w-full md:w-1/2 p-6 bg-background">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">로그인</TabsTrigger>
                  <TabsTrigger value="register">회원가입</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle>계정 로그인</CardTitle>
                      <CardDescription>
                        코드 스니펫을 공유하고 탐색할 수 있는 커뮤니티에 로그인하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="login-email">이메일</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="login-email" 
                                      placeholder="example@email.com" 
                                      type="email" 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="login-password">비밀번호</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="login-password" 
                                      type="password" 
                                      placeholder="••••••••" 
                                      className="pl-10"
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                              control={loginForm.control}
                              name="rememberMe"
                              render={({ field }) => (
                                <FormItem className="flex items-start space-x-2 mt-4">
                                  <FormControl>
                                    <Checkbox
                                      id="rememberMe"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                                      자동 로그인
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                로그인 중...
                              </>
                            ) : (
                              "로그인"
                            )}
                          </Button>
                        </form>
                      </Form>
                      
                      <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-background px-2 text-muted-foreground">
                            소셜 계정으로 로그인
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button variant="outline" type="button">
                          <Github className="mr-2 h-4 w-4" />
                          깃허브
                        </Button>
                        <Button variant="outline" type="button">
                          <Twitter className="mr-2 h-4 w-4" />
                          트위터
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  {verificationSent ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>이메일 인증이 필요합니다</CardTitle>
                        <CardDescription>
                          등록하신 이메일로 인증 링크를 발송했습니다
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-700">
                            계정 활성화를 위해 이메일을 확인하고 인증 링크를 클릭해주세요.
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground">
                          이메일이 도착하지 않았나요? 스팸 폴더를 확인하거나 잠시 후 다시 시도해주세요.
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setVerificationSent(false)}
                        >
                          다른 이메일로 가입하기
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>새 계정 만들기</CardTitle>
                        <CardDescription>
                          코드 스니펫을 공유하고 탐색할 수 있는 커뮤니티에 가입하세요
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...registerForm}>
                          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">

                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="register-email">이메일</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="register-email" 
                                      placeholder="example@email.com" 
                                      type="email" 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="register-fullName">성명</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="register-fullName" 
                                      placeholder="홍길동" 
                                      type="text" 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="register-password">비밀번호</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="register-password" 
                                      type="password" 
                                      placeholder="••••••••" 
                                      className="pl-10"
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="register-passwordConfirm">비밀번호 확인</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      type="password" 
                                      placeholder="••••••••" 
                                      className="pl-10"
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="acceptTerms"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-2 mt-4">
                                <FormControl>
                                  <Checkbox
                                    id="acceptTerms"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
                                    <span>
                                      <a 
                                        href="#" 
                                        className="text-primary hover:text-primary/80 mr-1"
                                      >
                                        서비스 이용약관
                                      </a>
                                      과
                                      <a 
                                        href="#" 
                                        className="text-primary hover:text-primary/80 mx-1"
                                      >
                                        개인정보 처리방침
                                      </a>
                                      에 동의합니다
                                    </span>
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                계정 생성 중...
                              </>
                            ) : (
                              "계정 생성하기"
                            )}
                          </Button>
                        </form>
                      </Form>
                      
                      <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-background px-2 text-muted-foreground">
                            소셜 계정으로 가입
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button variant="outline" type="button">
                          <Github className="mr-2 h-4 w-4" />
                          깃허브
                        </Button>
                        <Button variant="outline" type="button">
                          <Twitter className="mr-2 h-4 w-4" />
                          트위터
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Hero Section */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl p-8 flex flex-col justify-center text-white">
              <div className="max-w-md mx-auto">
                <div className="flex items-center mb-6">
                  <Code className="h-8 w-8 mr-2" />
                  <h2 className="text-2xl font-bold">코드 스니펫 허브</h2>
                </div>
                <h3 className="text-3xl font-bold mb-4">코드 공유. 함께 배우기.</h3>
                <p className="text-lg mb-6">
                  개발자 커뮤니티에 참여하여 코드 스니펫을 공유하고 발견하며, 피드백을 받고, 
                  코딩 실력을 향상시키세요.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="rounded-full bg-white/10 p-1 mr-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p>15개 이상의 프로그래밍 언어 구문 강조 지원</p>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full bg-white/10 p-1 mr-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p>즐겨찾는 코드 스니펫 저장 및 정리</p>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full bg-white/10 p-1 mr-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p>댓글을 통한 커뮤니티 피드백 받기</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}