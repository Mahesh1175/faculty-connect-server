import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

console.log("EMAIL:", process.env.EMAIL_USER);
console.log("PASS exists:", !!process.env.EMAIL_PASS);

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (to, subject, html, attachments = []) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments
    });

    console.log("✅ Email sent:", to);

  } catch (err) {
    console.log("❌ Email failed:", err.message);
  }
};
