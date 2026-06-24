import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Debug logs
console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (
  to,
  subject,
  html,
  attachments = []
) => {
  try {
    console.log("\n========== EMAIL DEBUG ==========");
    console.log("From:", process.env.EMAIL_FROM);
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Attachments:", attachments.length);
    console.log("=================================\n");

    const response = await resend.emails.send({
      from: `Campus Visitor System <${process.env.EMAIL_FROM}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments,
    });

    console.log("✅ Email sent successfully");
    console.log("📨 Resend Response:", response);

    return response;
  } catch (error) {
    console.error("❌ Email sending failed");
    console.error(error);

    throw error;
  }
};