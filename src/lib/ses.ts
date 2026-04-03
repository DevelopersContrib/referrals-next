import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  fromName?: string;
}

export async function sendEmail({ to, subject, html, fromName }: SendEmailParams) {
  const recipients = Array.isArray(to) ? to : [to];
  const sender = fromName
    ? `${fromName} <${process.env.AWS_SES_FROM_EMAIL}>`
    : process.env.AWS_SES_FROM_EMAIL!;

  const command = new SendEmailCommand({
    Source: sender,
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
      },
    },
  });

  return sesClient.send(command);
}

export async function sendVerificationEmail(email: string, code: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?code=${code}&email=${encodeURIComponent(email)}`;

  return sendEmail({
    to: email,
    subject: "Verify your email - Referrals.com",
    fromName: "Referrals.com",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Referrals.com!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
        <p>Or copy and paste this link: ${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?code=${code}&email=${encodeURIComponent(email)}`;

  return sendEmail({
    to: email,
    subject: "Reset your password - Referrals.com",
    fromName: "Referrals.com",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
