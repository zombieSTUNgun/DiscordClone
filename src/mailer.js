import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOtpEmail(to, code, purpose) {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV OTP] ${purpose} for ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@indie.local',
    to,
    subject: `Your ${purpose} code`,
    text: `Your one-time code is ${code}. It expires in 10 minutes.`
  });
}
