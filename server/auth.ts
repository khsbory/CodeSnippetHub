import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { generateVerificationToken, sendVerificationEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "snippet-hub-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // 이메일이 없는 경우 오류 반환
      if (!req.body.email) {
        return res.status(400).json({ message: "이메일 주소는 필수입니다" });
      }

      // 이메일에서 사용자 이름 생성 (@ 이전 부분)
      const username = req.body.username || req.body.email.split('@')[0];
      
      // 사용자 이름 중복 체크 및 고유한 사용자 이름 생성
      let uniqueUsername = username;
      let existingUsername = await storage.getUserByUsername(uniqueUsername);
      let count = 1;
      
      // 이미 존재하는 사용자 이름인 경우 숫자를 붙여 고유한 이름 생성
      while (existingUsername) {
        uniqueUsername = `${username}${count}`;
        existingUsername = await storage.getUserByUsername(uniqueUsername);
        count++;
      }
      
      // 이메일 중복 체크
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "이미 가입된 이메일 주소입니다" });
      }
      
      // req.body 업데이트 - 자동 생성된 사용자 이름 적용
      req.body.username = uniqueUsername;

      // 인증 토큰 발급 (24시간 유효)
      const verificationToken = generateVerificationToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      // 사용자 생성
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isVerified: false,
        verificationToken,
        tokenExpiry,
      });

      // 인증 이메일 전송
      const emailSent = await sendVerificationEmail(
        req.body.email,
        req.body.username,
        verificationToken
      );

      // 민감 정보 제외하고 응답 반환
      const { password, verificationToken: token, ...userWithoutSensitiveInfo } = user;

      if (emailSent) {
        // 이메일 인증이 필요하므로 자동 로그인은 하지 않음
        res.status(201).json({ 
          ...userWithoutSensitiveInfo,
          message: "가입이 완료되었습니다. 이메일 인증을 통해 계정을 활성화해주세요.",
          needVerification: true
        });
      } else {
        res.status(201).json({ 
          ...userWithoutSensitiveInfo,
          message: "가입이 완료되었으나 이메일 전송에 실패했습니다. 관리자에게 문의해주세요.",
          needVerification: true
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "이메일 주소 또는 비밀번호가 올바르지 않습니다" });
      
      // 이메일 인증 상태 확인
      if (!user.isVerified) {
        return res.status(403).json({ 
          message: "이메일 인증이 필요합니다. 인증 이메일을 확인해주세요.",
          needVerification: true 
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // 민감한 정보 제외하고 응답
        const { password, verificationToken, tokenExpiry, ...userWithoutSensitiveInfo } = user;
        res.status(200).json(userWithoutSensitiveInfo);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Exclude password from response
    if (req.user) {
      const { password, verificationToken, tokenExpiry, ...userWithoutSensitiveInfo } = req.user;
      res.json(userWithoutSensitiveInfo);
    } else {
      res.sendStatus(401);
    }
  });
  
  // 이메일 인증 처리 라우트
  app.get("/verify-email", async (req, res) => {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>이메일 인증 실패</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
              .container { max-width: 600px; margin: 100px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
              h1 { color: #d32f2f; }
              .message { margin: 20px 0; }
              .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>인증 오류</h1>
              <div class="message">
                <p>유효하지 않은 인증 링크입니다.</p>
                <p>올바른 인증 링크를 사용해주세요.</p>
              </div>
              <a href="/" class="btn">홈으로 돌아가기</a>
            </div>
          </body>
        </html>
      `);
    }
    
    try {
      // 토큰으로 사용자 찾기
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).send(`
          <html>
            <head>
              <title>이메일 인증 실패</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
                .container { max-width: 600px; margin: 100px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
                h1 { color: #d32f2f; }
                .message { margin: 20px 0; }
                .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>인증 오류</h1>
                <div class="message">
                  <p>유효하지 않은 인증 링크입니다.</p>
                  <p>인증 링크가 만료되었거나 이미 인증이 완료되었을 수 있습니다.</p>
                </div>
                <a href="/" class="btn">홈으로 돌아가기</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // 토큰 만료 확인
      if (user.tokenExpiry && new Date() > user.tokenExpiry) {
        return res.status(400).send(`
          <html>
            <head>
              <title>이메일 인증 실패</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
                .container { max-width: 600px; margin: 100px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
                h1 { color: #d32f2f; }
                .message { margin: 20px 0; }
                .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>인증 링크 만료</h1>
                <div class="message">
                  <p>인증 링크가 만료되었습니다.</p>
                  <p>계정 설정에서 새로운 인증 이메일을 요청해주세요.</p>
                </div>
                <a href="/" class="btn">홈으로 돌아가기</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // 사용자 인증 처리
      await storage.verifyUser(user.id);
      
      // 성공 페이지 반환
      res.status(200).send(`
        <html>
          <head>
            <title>이메일 인증 성공</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
              .container { max-width: 600px; margin: 100px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
              h1 { color: #4caf50; }
              .message { margin: 20px 0; }
              .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>인증 성공</h1>
              <div class="message">
                <p>이메일 인증이 성공적으로 완료되었습니다.</p>
                <p>이제 Code Snippet Hub의 모든 기능을 이용하실 수 있습니다.</p>
              </div>
              <a href="/auth?tab=login" class="btn">로그인하기</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('이메일 인증 오류:', error);
      res.status(500).send(`
        <html>
          <head>
            <title>서버 오류</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
              .container { max-width: 600px; margin: 100px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
              h1 { color: #d32f2f; }
              .message { margin: 20px 0; }
              .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>서버 오류</h1>
              <div class="message">
                <p>서버에서 오류가 발생했습니다.</p>
                <p>잠시 후 다시 시도해주세요.</p>
              </div>
              <a href="/" class="btn">홈으로 돌아가기</a>
            </div>
          </body>
        </html>
      `);
    }
  });
}
