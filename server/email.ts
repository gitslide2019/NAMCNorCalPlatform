import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

const ADDRESS = "NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621";
const LOGO_CID = "namc-logo";

function getLogoAttachment(): { content: string; filename: string; content_type: string; content_id: string } | null {
  try {
    const logoPath = path.join(process.cwd(), "client", "public", "namc-logo.png");
    const content = fs.readFileSync(logoPath).toString("base64");
    return { content, filename: "namc-logo.png", content_type: "image/png", content_id: LOGO_CID };
  } catch {
    return null;
  }
}

const LOGO_ATTACHMENT = getLogoAttachment();

function emailHeader() {
  const imgTag = LOGO_ATTACHMENT
    ? `<img src="cid:${LOGO_CID}" alt="NAMC NorCal" width="160" style="width: 160px; height: auto; display: block; margin: 0 auto;" />`
    : `<span style="color: #E5A830; font-size: 22px; font-weight: 700; letter-spacing: 1px;">NAMC NorCal</span>`;
  return `
    <div style="background-color: #ffffff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #E5A830;">
      ${imgTag}
    </div>
  `;
}

function emailFooter(extra = "") {
  return `
    <div style="text-align: center; color: #999; font-size: 12px; padding: 16px 0;">
      <p style="margin: 0;">${ADDRESS}</p>
      ${extra ? `<p style="margin: 4px 0 0;">${extra}</p>` : ""}
    </div>
  `;
}

function emailWrapper(body: string, footerExtra = "") {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${emailHeader()}
      <div style="padding: 30px;">
        ${body}
      </div>
      ${emailFooter(footerExtra)}
    </div>
  `;
}

function logoAttachments() {
  return LOGO_ATTACHMENT ? [LOGO_ATTACHMENT] : [];
}

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  const formattedFrom = fromEmail
    ? `NAMC NorCal <${fromEmail}>`
    : "NAMC NorCal <noreply@resend.dev>";
  return {
    client: new Resend(apiKey),
    fromEmail: formattedFrom,
  };
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  contactName: string
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const firstName = contactName.split(" ")[0] || "Member";

  const body = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px;">Password Reset Request</h2>
    <p style="color: #333; line-height: 1.6;">Hi ${firstName},</p>
    <p style="color: #333; line-height: 1.6;">
      We received a request to reset your password for the NAMC NorCal Member Portal.
      Click the button below to create a new password.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="background-color: #E5A830; color: #000; text-decoration: none;
                padding: 14px 32px; border-radius: 6px; font-weight: 600;
                display: inline-block; font-size: 16px;">
        Reset Password
      </a>
    </div>
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request a password reset,
      you can safely ignore this email.
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 20px; word-break: break-all;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #E5A830;">${resetUrl}</a>
    </p>
  `;

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: "Reset Your NAMC NorCal Password",
    html: emailWrapper(body),
    attachments: logoAttachments(),
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send password reset email");
  }

  return data;
}

export async function sendNewsletterEmail(
  toEmail: string,
  title: string,
  content: string
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const body = `
    <h2 style="color: #1a1a1a; margin: 0 0 8px;">${title}</h2>
    <div style="height: 3px; background: #E5A830; margin-bottom: 20px; border-radius: 2px;"></div>
    <div style="color: #333; line-height: 1.6;">${content.replace(/\n/g, "<br>")}</div>
  `;

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: `NAMC NorCal Newsletter: ${title}`,
    html: emailWrapper(body, "You received this as an approved NAMC NorCal member."),
    attachments: logoAttachments(),
  });

  if (error) {
    console.error("Failed to send newsletter email:", error);
    throw new Error("Failed to send newsletter email");
  }
  return data;
}

export async function sendDigestEmail(
  toEmail: string,
  announcements: any[],
  projects: any[],
  events: any[]
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const section = (label: string, items: string[]) =>
    items.length > 0
      ? `<h3 style="color: #E5A830; margin: 20px 0 8px; font-size: 15px;">${label}</h3>` +
        items.map(i => `<p style="margin: 4px 0; color: #333;">• ${i}</p>`).join("")
      : "";

  const announcementSection = section("Announcements", announcements.map(a => a.title));
  const projectSection = section("Open Projects", projects.map(p => `${p.title} — ${p.location}`));
  const eventSection = section("Upcoming Events", events.map(e => `${e.title} — ${e.eventDate}`));
  const empty = !announcementSection && !projectSection && !eventSection
    ? '<p style="color: #666;">No new updates this week.</p>' : "";

  const body = `
    <h2 style="color: #1a1a1a; margin: 0 0 8px;">Weekly Digest</h2>
    <div style="height: 3px; background: #E5A830; margin-bottom: 20px; border-radius: 2px;"></div>
    <p style="color: #333; line-height: 1.6;">Here's what's happening at NAMC NorCal:</p>
    ${announcementSection}
    ${projectSection}
    ${eventSection}
    ${empty}
  `;

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: "NAMC NorCal Weekly Digest",
    html: emailWrapper(body, "You received this as an approved NAMC NorCal member."),
    attachments: logoAttachments(),
  });

  if (error) {
    console.error("Failed to send digest email:", error);
    throw new Error("Failed to send digest email");
  }
  return data;
}

export async function sendLoginInviteEmail(
  toEmail: string,
  loginUrl: string,
  contactName: string,
  username: string,
  tempPassword: string
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const firstName = contactName.split(" ")[0] || "Member";

  const body = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px;">Welcome to the Member Portal!</h2>
    <p style="color: #333; line-height: 1.6;">Hi ${firstName},</p>
    <p style="color: #333; line-height: 1.6;">
      Your NAMC NorCal Member Portal account has been created and is ready for you to log in.
    </p>
    <div style="background: #f9f9f9; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="color: #333; margin: 0 0 8px;"><strong>Username:</strong> ${username}</p>
      <p style="color: #333; margin: 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
    </div>
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Please change your password after your first login.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}"
         style="background-color: #E5A830; color: #000; text-decoration: none;
                padding: 14px 32px; border-radius: 6px; font-weight: 600;
                display: inline-block; font-size: 16px;">
        Log In Now
      </a>
    </div>
  `;

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: "Your NAMC NorCal Member Portal Account is Ready",
    html: emailWrapper(body),
    attachments: logoAttachments(),
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    throw new Error("Failed to send invite email");
  }

  return data;
}

export async function sendGeneralMemberEmailBatch(
  emails: string[],
  subject: string,
  messageBody: string,
  callToActionHtml = ""
): Promise<{ sent: number; failed: number }> {
  const { client, fromEmail } = await getUncachableResendClient();
  const from = fromEmail;

  const body = `
    <div style="color: #1a1a1a; line-height: 1.8;">${messageBody.replace(/\n/g, "<br/>")}</div>
    ${callToActionHtml}
  `;
  const html = emailWrapper(body, "You received this because you are an approved NAMC NorCal member.");

  const results: boolean[] = [];
  const BATCH_SIZE = 4;
  const DELAY_MS = 1100;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (toEmail) => {
        try {
          const { error } = await client.emails.send({
            from,
            to: [toEmail],
            subject,
            html,
            attachments: logoAttachments(),
          });
          if (error) { console.error(`Failed to send to ${toEmail}:`, error.message); return false; }
          return true;
        } catch (err: any) {
          console.error(`Error sending to ${toEmail}:`, err.message);
          return false;
        }
      })
    );
    results.push(...batchResults);
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  const sent = results.filter(Boolean).length;
  return { sent, failed: results.length - sent };
}

export async function sendRenewalReminderEmail(
  toEmail: string,
  contactName: string,
  companyName: string,
  renewalDate: string,
  membershipTier: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const firstName = contactName.split(" ")[0] || "Member";

    const tierLabel = membershipTier || "NAMC NorCal";
    const isOverdue = (() => {
      try {
        return new Date(renewalDate) < new Date();
      } catch {
        return false;
      }
    })();

    const headline = isOverdue
      ? "Your Membership Has Expired"
      : "Your Membership is Coming Up for Renewal";

    const bodyText = isOverdue
      ? `Your <strong>${tierLabel}</strong> membership expired on <strong>${renewalDate}</strong>. Renew now to continue enjoying full access to NAMC NorCal resources, networking events, and project opportunities.`
      : `Your <strong>${tierLabel}</strong> membership for <strong>${companyName}</strong> is scheduled to renew on <strong>${renewalDate}</strong>. Please take a moment to confirm your renewal so there's no interruption to your benefits.`;

    const body = `
      <h2 style="color: #1a1a1a; margin: 0 0 16px;">${headline}</h2>
      <p style="color: #333; line-height: 1.6;">Hi ${firstName},</p>
      <p style="color: #333; line-height: 1.6;">${bodyText}</p>
      <div style="background: #fdf8ed; border-left: 4px solid #E5A830; padding: 16px 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #333; font-size: 14px;">
          <strong>Member:</strong> ${contactName}<br>
          <strong>Company:</strong> ${companyName}<br>
          <strong>Tier:</strong> ${tierLabel}<br>
          <strong>Renewal Date:</strong> ${renewalDate}
        </p>
      </div>
      <p style="color: #333; line-height: 1.6;">
        To renew your membership or if you have any questions, please contact us directly.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:info@namcnorcal.org?subject=Membership Renewal - ${encodeURIComponent(companyName)}"
           style="background-color: #E5A830; color: #000; text-decoration: none;
                  padding: 14px 32px; border-radius: 6px; font-weight: 600;
                  display: inline-block; font-size: 16px;">
          Contact Us to Renew
        </a>
      </div>
      <p style="color: #999; font-size: 13px; line-height: 1.6;">
        You can also reach us at <a href="mailto:info@namcnorcal.org" style="color: #E5A830;">info@namcnorcal.org</a>
        or call <a href="tel:+15108308294" style="color: #E5A830;">(510) 830-8294</a>.
      </p>
    `;

    const subject = isOverdue
      ? `Action Required: Your NAMC NorCal Membership Has Expired`
      : `Reminder: Your NAMC NorCal Membership Renews on ${renewalDate}`;

    const { data, error } = await client.emails.send({
      from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
      to: [toEmail],
      subject,
      html: emailWrapper(body, "You received this as an approved NAMC NorCal member."),
      attachments: logoAttachments(),
    });

    if (error) {
      return { success: false, error: error.message || "Send failed" };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send email" };
  }
}

export async function sendInvitationEmail(
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const { data, error } = await client.emails.send({
      from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
      to: [toEmail],
      subject,
      html: emailWrapper(htmlBody),
      attachments: logoAttachments(),
    });

    if (error) {
      return { success: false, error: error.message || "Send failed" };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send email" };
  }
}

export async function sendEventReminderEmail(
  toEmail: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string | null | undefined,
  eventLocation: string | null | undefined,
  eventDescription: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { success: false, error: "RESEND_API_KEY not configured" };

  const client = new Resend(resendKey);

  const timeStr = eventTime ? ` at ${eventTime}` : "";
  const locationHtml = eventLocation
    ? `<p style="margin: 6px 0;"><strong>Location:</strong> ${eventLocation}</p>`
    : "";
  const descHtml = eventDescription
    ? `<p style="margin: 12px 0; color: #555;">${eventDescription}</p>`
    : "";

  const htmlBody = `
    <h2 style="color: #E5A830; margin: 0 0 16px;">Event Reminder</h2>
    <p style="margin: 0 0 12px;">You have an upcoming NAMC NorCal event tomorrow:</p>
    <div style="background: #f9f9f9; border-left: 4px solid #E5A830; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 18px;">${eventTitle}</h3>
      <p style="margin: 6px 0;"><strong>Date:</strong> ${eventDate}${timeStr}</p>
      ${locationHtml}
      ${descHtml}
    </div>
    <p style="color: #888; font-size: 13px;">Log in to the NAMC NorCal member portal to view full event details.</p>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: "NAMC NorCal <noreply@resend.dev>",
      to: [toEmail],
      subject: `Reminder: ${eventTitle} is tomorrow`,
      html: emailWrapper(htmlBody),
      attachments: LOGO_ATTACHMENT ? [LOGO_ATTACHMENT] : [],
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: (data as any)?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send reminder" };
  }
}
