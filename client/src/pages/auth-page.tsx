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
  username: z.string()
    .min(3, "사용자 이름은 최소 3자 이상이어야 합니다")
    .max(20, "사용자 이름은 최대 20자까지 가능합니다")
    .regex(/^[a-zA-Z0-9_-]+$/, "사용자 이름은 영문자, 숫자, 밑줄(_), 하이픈(-)만 포함할 수 있습니다"),
  email: z.string()
    .email("유효한 이메일 주소를 입력해주세요"),
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
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // 상태 관리
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  
  // Form handlers
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };
  
  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      username: values.username,
      email: values.email,
      password: values.password,
    }, {
      onSuccess: () => {
        setVerificationSent(true);
      }
    });
  };
  
  // If still checking auth status, show loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Auth Forms */}
            <div className="w-full md:w-1/2 md:max-w-md mx-auto">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle>Login to your account</CardTitle>
                      <CardDescription>
                        Enter your credentials to access your account
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
                                <FormLabel>이메일</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      placeholder="example@email.com" 
                                      className="pl-10" 
                                      type="email" 
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
                                <FormLabel>비밀번호</FormLabel>
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
                          <div className="flex items-center justify-between">
                            <FormField
                              control={loginForm.control}
                              name="rememberMe"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    Remember me
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            <a 
                              href="#" 
                              className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                              Forgot password?
                            </a>
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging in...
                              </>
                            ) : (
                              "Log in"
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
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button variant="outline" type="button">
                          <Github className="mr-2 h-4 w-4" />
                          Github
                        </Button>
                        <Button variant="outline" type="button">
                          <Twitter className="mr-2 h-4 w-4" />
                          Twitter
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
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>사용자 이름</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      placeholder="johndoe" 
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
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이메일</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
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
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>비밀번호</FormLabel>
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
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>비밀번호 확인</FormLabel>
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
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    I agree to the{" "}
                                    <a 
                                      href="#" 
                                      className="text-primary hover:text-primary/80"
                                    >
                                      terms of service
                                    </a>{" "}
                                    and{" "}
                                    <a 
                                      href="#" 
                                      className="text-primary hover:text-primary/80"
                                    >
                                      privacy policy
                                    </a>
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
                                Creating account...
                              </>
                            ) : (
                              "Create account"
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
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button variant="outline" type="button">
                          <Github className="mr-2 h-4 w-4" />
                          Github
                        </Button>
                        <Button variant="outline" type="button">
                          <Twitter className="mr-2 h-4 w-4" />
                          Twitter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Hero Section */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl p-8 flex flex-col justify-center text-white">
              <div className="max-w-md mx-auto">
                <div className="flex items-center mb-6">
                  <Code className="h-8 w-8 mr-2" />
                  <h2 className="text-2xl font-bold">Code Snippet Hub</h2>
                </div>
                <h3 className="text-3xl font-bold mb-4">Share Code. Learn Together.</h3>
                <p className="text-lg mb-6">
                  Join our community of developers to share and discover code snippets, get feedback,
                  and improve your coding skills.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="rounded-full bg-white/10 p-1 mr-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p>Syntax highlighting for 15+ programming languages</p>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full bg-white/10 p-1 mr-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p>Save and organize your favorite code snippets</p>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full bg-white/10 p-1 mr-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p>Get feedback from the community through comments</p>
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
