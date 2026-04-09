import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`

  await resend.emails.send({
    from: 'DevHub <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your DevHub email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Click the button below to verify your email address and access your DevHub account.
        </p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; background: #18181b; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;"
        >
          Verify email
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This link expires in 24 hours. If you didn't create a DevHub account, you can ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await resend.emails.send({
    from: 'DevHub <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your DevHub password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Click the button below to reset your DevHub password.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #18181b; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;"
        >
          Reset password
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
        </p>
      </div>
    `,
  })
}
