import nodemailer from 'nodemailer';
import { Notification } from '../models/Notification.js';

let EMAIL_USER = process.env.EMAIL_USER;
let EMAIL_PASS = process.env.EMAIL_PASS;

let transporter: nodemailer.Transporter | null = null;

export async function setupEmail(user?: string, pass?: string) {
  if (user) EMAIL_USER = user;
  if (pass) EMAIL_PASS = pass;

  if (EMAIL_USER && EMAIL_PASS && EMAIL_USER !== 'your_gmail@gmail.com') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    console.log('📧 Email service configured with Gmail SMTP');
  } else {
    console.warn('⚠️  Email credentials not configured. Initializing Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('📧 Ethereal Email service configured for testing.');
      console.log(`   Account: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal test account:', err);
    }
  }
}

// Initial setup
setupEmail();


async function logNotification(userId: string, type: string, subject: string, body: string, status: 'sent' | 'failed', error?: string) {
  try {
    await Notification.create({ userId, type, subject, body, status, error, sentAt: new Date() });
  } catch (e) {
    console.error('Failed to log notification:', e);
  }
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<{ sent: boolean, etherealUrl?: string }> {
  if (!transporter) {
    console.log(`📧 [SIMULATED] Email to ${to}: ${subject}`);
    return { sent: false };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Did I Take It?" <${EMAIL_USER && EMAIL_USER !== 'your_gmail@gmail.com' ? EMAIL_USER : 'noreply@diditakeit.com'}>`,
      to,
      subject,
      html,
      attachments,
    });
    
    // Check if it's an Ethereal email and print the preview URL
    if (info.messageId && (!EMAIL_USER || EMAIL_USER === 'your_gmail@gmail.com')) {
      const url = nodemailer.getTestMessageUrl(info) as string;
      console.log(`📧 [ETHEREAL PREVIEW] ${subject}`);
      console.log(`   URL: ${url}`);
      return { sent: true, etherealUrl: url };
    } else {
      console.log(`📧 Email sent to ${to}: ${subject}`);
      return { sent: true };
    }
  } catch (err: any) {
    console.error('Email send error:', err.message);
    return { sent: false };
  }
}

export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  const subject = '🎉 Welcome to Did I Take It!';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #005da7 0%, #2976c7 100%); padding: 40px 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">💊 Did I Take It?</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px;">Your personal medication manager</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #191c1e; font-size: 22px;">Welcome, ${name}! 👋</h2>
        <p style="color: #414751; font-size: 15px; line-height: 1.6;">
          Your account has been created successfully. You can now start tracking your medications, 
          set up dose schedules, and receive timely email reminders.
        </p>
        <div style="background: #ffffff; border: 1px solid #e0e3e6; border-radius: 12px; padding: 20px; margin-top: 20px;">
          <p style="color: #005da7; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Getting Started</p>
          <ul style="color: #414751; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li>Add your medications from the Dashboard</li>
            <li>Set up your dose schedules</li>
            <li>Enable email reminders in Settings</li>
            <li>Log doses daily to build your streak 🔥</li>
          </ul>
        </div>
      </div>
      <div style="padding: 20px 32px; text-align: center; border-top: 1px solid #e0e3e6;">
        <p style="color: #9da3ae; font-size: 11px; margin: 0;">Did I Take It? — Stay on track with your health.</p>
      </div>
    </div>
  `;

  const result = await sendEmail(email, subject, html);
  await logNotification(userId, 'welcome', subject, html, result.sent ? 'sent' : 'failed');
}

export async function sendDoseReminder(userId: string, email: string, userName: string, medName: string, dosage: string, time: string) {
  const subject = `⏰ Reminder: Time to take ${medName}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #006d36 0%, #00a550 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">⏰ Medication Reminder</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #191c1e; font-size: 20px;">Hi ${userName},</h2>
        <p style="color: #414751; font-size: 15px; line-height: 1.6;">
          It's time to take your medication:
        </p>
        <div style="background: #ffffff; border: 1px solid #e0e3e6; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <p style="color: #005da7; font-weight: 800; font-size: 24px; margin: 0;">${medName}</p>
          <p style="color: #414751; font-size: 16px; margin: 8px 0;">${dosage} — Scheduled for ${time}</p>
        </div>
        <p style="color: #414751; font-size: 14px;">
          Log into the app to mark this dose as taken and keep your streak going! 🔥
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail(email, subject, html);
  await logNotification(userId, 'dose_reminder', subject, html, result.sent ? 'sent' : 'failed');
}

export async function sendMissedAlert(userId: string, email: string, userName: string, medName: string, dosage: string, time: string) {
  const subject = `⚠️ Missed Dose: ${medName}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ba1a1a 0%, #e53935 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">⚠️ Missed Dose Alert</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #191c1e; font-size: 20px;">Hi ${userName},</h2>
        <p style="color: #414751; font-size: 15px; line-height: 1.6;">
          It looks like you missed a scheduled dose:
        </p>
        <div style="background: #fff0f0; border: 1px solid #ffdad6; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <p style="color: #ba1a1a; font-weight: 800; font-size: 24px; margin: 0;">${medName}</p>
          <p style="color: #93000a; font-size: 16px; margin: 8px 0;">${dosage} — Was due at ${time}</p>
        </div>
        <p style="color: #414751; font-size: 14px;">
          Don't worry — log into the app to update your schedule. Consistency is key! 💪
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail(email, subject, html);
  await logNotification(userId, 'missed_alert', subject, html, result.sent ? 'sent' : 'failed');
}

export async function sendDoseTakenEmail(userId: string, email: string, userName: string, medName: string, dosage: string, time: string) {
  const subject = `✅ Dose Taken: ${medName}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #005da7 0%, #2976c7 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">✅ Dose Logged Successfully</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #191c1e; font-size: 20px;">Great job, ${userName}!</h2>
        <p style="color: #414751; font-size: 15px; line-height: 1.6;">
          You've successfully logged your medication:
        </p>
        <div style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <p style="color: #2e7d32; font-weight: 800; font-size: 24px; margin: 0;">${medName}</p>
          <p style="color: #1b5e20; font-size: 16px; margin: 8px 0;">${dosage} — Scheduled for ${time}</p>
        </div>
        <p style="color: #414751; font-size: 14px;">
          Keep up the great work and maintain your streak! 🔥
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail(email, subject, html);
  await logNotification(userId, 'dose_taken', subject, html, result.sent ? 'sent' : 'failed');
  return result;
}
