import nodemailer from "nodemailer";
import fs from "fs";
import { EMAIL_TEMPLATE, EMAIL_SUBJECT } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

export const sendEmails = async () => {
  try {
    const emails = JSON.parse(fs.readFileSync("./emails.json"));

    if (!Array.isArray(emails)) {
      throw new Error(
        `emails.json must contain an array. Found: ${typeof emails}`
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AVAILR_EMAIL,
        pass: process.env.AVAILR_PASS,
      },
    });
    const failedEmails = [];

    for (const user of emails) {
      const email = user.email || user.Email;
      const name = user.name || user.Name || "there";

      if (!email) continue;

      try {
        await transporter.sendMail({
          from: process.env.AVAILR_EMAIL,
          to: email,
          subject: EMAIL_SUBJECT,
          html: EMAIL_TEMPLATE(
            name,
            `http://localhost:3000/confirm?name=${encodeURIComponent(
              name
            )}&email=${encodeURIComponent(email)}`
          ),
        });
        console.log(`✉️ Sent to ${email}`);
      } catch (sendError) {
        console.error(`❌ Failed to send to ${email}: ${sendError.message}`);
        failedEmails.push({ ...user, error: sendError.message });
      }
    }

    if (failedEmails.length > 0) {
      fs.writeFileSync(
        "./failedEmails.json",
        JSON.stringify(failedEmails, null, 2)
      );
      console.log(
        `⚠️  ${failedEmails.length} failed email(s) saved to failedEmails.json`
      );
    }
  } catch (error) {
    console.error("Error sending emails:", error.message);
    throw error;
  }
};
