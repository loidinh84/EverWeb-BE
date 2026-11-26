import nodemailer from "nodemailer";
import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendWeddingEmail({
  wedding,
  features,
  payload = {},
}) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    throw new AppError(
      "Chưa cấu hình SMTP_USER / SMTP_PASS trong .env của Backend",
      500
    );
  }

  let targetEmails = [];
  if (Array.isArray(payload.recipients) && payload.recipients.length > 0) {
    targetEmails = payload.recipients
      .map((e) => String(e || "").trim())
      .filter((e) => EMAIL_REGEX.test(e));
  } else if (typeof payload.recipients === "string" && payload.recipients.trim()) {
    targetEmails = payload.recipients
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => EMAIL_REGEX.test(e));
  } else {
    const guestList = Array.isArray(features?.collect_contacts?.guestList)
      ? features.collect_contacts.guestList
      : [];
    const fromFeature = guestList
      .map((g) => String(g.email || "").trim())
      .filter((e) => EMAIL_REGEX.test(e));

    const dbGuests = await prisma.guests.findMany({
      where: { wedding_id: wedding.id },
      select: { email: true },
    });
    const fromDb = dbGuests
      .map((g) => String(g.email || "").trim())
      .filter((e) => EMAIL_REGEX.test(e));

    targetEmails = Array.from(new Set([...fromFeature, ...fromDb]));
  }

  if (targetEmails.length === 0) {
    throw new AppError(
      "Không tìm thấy địa chỉ email hợp lệ nào để gửi",
      400
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const senderTitle =
    String(payload.senderName || wedding.title || "EverWed").trim();
  const subject =
    String(payload.subject || `Thư mời từ ${senderTitle}`).trim();
  const bodyText = String(payload.body || "").trim();
  const buttonText = String(payload.buttonText || "").trim();
  const ctaUrl = String(payload.ctaUrl || "").trim();

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #FAF8F5; border: 1px solid #EAE3D8; border-radius: 16px; padding: 32px; color: #1F1A17;">
      <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8C7A68; margin: 0 0 8px;">EverWed · Thiệp & Thông báo</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; color: #1F1A17;">${senderTitle}</h2>
      <p style="font-size: 14px; line-height: 1.7; white-space: pre-line; color: #3B2A1A;">${bodyText}</p>
      ${
        buttonText && ctaUrl
          ? `<div style="margin-top: 24px; text-align: center;">
              <a href="${ctaUrl}" style="display: inline-block; background: #3B52DE; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-size: 13px; font-weight: 600;">${buttonText}</a>
            </div>`
          : ""
      }
      <hr style="border: none; border-top: 1px solid #EAE3D8; margin: 28px 0 14px;" />
      <p style="font-size: 11px; color: #8C7A68; margin: 0;">Gửi từ hệ thống quản lý lễ cưới EverWeb.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${senderTitle}" <${smtpUser}>`,
    to: targetEmails.join(", "),
    subject,
    text: ctaUrl ? `${bodyText}\n\n${buttonText || "Mở liên kết"}: ${ctaUrl}` : bodyText,
    html,
  });

  return {
    sentCount: targetEmails.length,
    recipients: targetEmails,
  };
}
