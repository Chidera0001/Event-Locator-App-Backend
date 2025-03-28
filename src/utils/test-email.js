const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  try {
    // Test email
    const info = await transporter.sendMail({
      from: `"Event Locator" <${process.env.SMTP_USER}>`,
      to: "your.test.email@example.com", // Email where you want to receive the test
      subject: "Test Email from Event Locator",
      text: "If you receive this email, your email configuration is working!",
      html: "<b>If you receive this email, your email configuration is working!</b>"
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testEmailConfig(); 