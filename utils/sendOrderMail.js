import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOrderMail = async ({
  to,
  userName,
  orderId,
  totalAmount,
  paymentStatus,
  paymentMethod,
}) => {
  if (!to) {
    throw new Error("Recipient email is missing");
  }

  const info = await transporter.sendMail({
    from: `"Mega Basket" <${process.env.SMTP_USER}>`,
    to,
    subject: `Order Confirmation - ${orderId}`,
    text: `Your order ${orderId} has been placed successfully.`,
    html: `
      <h2>Hi ${userName},</h2>
      <p>Your order has been successfully placed 🎉</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p><strong>Payment Status:</strong> ${paymentStatus}</p>
      <br/>
      <p>— Mega Basket Team</p>
    `,
  });

  console.log("📧 Email sent:", info.messageId);
};
