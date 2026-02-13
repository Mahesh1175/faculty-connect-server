import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log("EMAIL:", process.env.EMAIL_USER);
console.log("PASS exists:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // MUST be false
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 20000, // helps cloud
});


export const sendMail = async (to, subject, html, attachments = []) => {
  await transporter.sendMail({
    from: `"Campus Visitor System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments
  });
};
