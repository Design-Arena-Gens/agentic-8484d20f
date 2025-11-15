import { Resend } from 'resend';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set; email will not be sent');
    return;
  }
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const result = await resend.emails.send({ from, to, subject, html });
  if ((result as any).error) {
    console.error('Error sending email', (result as any).error);
  }
}
