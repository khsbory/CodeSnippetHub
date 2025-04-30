import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// 환경 변수에서 SMTP 설정 가져오기
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// SMTP 트랜스포터 생성
const transporter = nodemailer.createTransport(smtpConfig);

// 인증 토큰 생성 함수
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// 이메일 템플릿: 인증 이메일
function createVerificationEmailTemplate(username: string, verificationUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Code Snippet Hub</h1>
      </div>
      <p>안녕하세요 ${username}님,</p>
      <p>Code Snippet Hub에 가입해주셔서 감사합니다! 아래 버튼을 클릭하여 이메일 주소를 인증해주세요:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">이메일 인증하기</a>
      </div>
      <p>또는 다음 링크를 브라우저에 복사하여 인증할 수 있습니다:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>이 링크는 24시간 동안 유효합니다.</p>
      <p>이 이메일을 요청하지 않았다면 무시하셔도 됩니다.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9e9e9; text-align: center; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Code Snippet Hub. All rights reserved.</p>
      </div>
    </div>
  `;
}

// 이메일 보내기 함수
export async function sendVerificationEmail(
  email: string, 
  username: string, 
  verificationToken: string
): Promise<boolean> {
  // 베이스 URL 결정 (개발/프로덕션)
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.BASE_URL || 'https://codesnippethub.com' 
    : 'http://localhost:5000';
  
  // 인증 URL 생성
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  try {
    await transporter.sendMail({
      from: `"Code Snippet Hub" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: '이메일 주소 인증',
      html: createVerificationEmailTemplate(username, verificationUrl),
    });
    
    return true;
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    return false;
  }
}