import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS, EMAIL_SERVICE } from "../config/env.js";

const sendEmail = async ({ email, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE || "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Exam Platform" <${EMAIL_USER}>`,
    to: email,
    subject: subject,
    text: text,
    html: html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
