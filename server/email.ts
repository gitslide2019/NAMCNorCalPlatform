import { Resend } from "resend";

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
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  contactName: string
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const firstName = contactName.split(" ")[0] || "Member";

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: "Reset Your NAMC NorCal Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin: 0;">NAMC NorCal</h1>
          <p style="color: #666; margin: 4px 0 0;">Member Portal</p>
        </div>
        
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
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
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621</p>
        </div>
      </div>
    `,
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

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: `NAMC NorCal Newsletter: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin: 0;">NAMC NorCal</h1>
          <p style="color: #666; margin: 4px 0 0;">Newsletter</p>
        </div>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1a1a1a; margin: 0 0 16px;">${title}</h2>
          <div style="color: #333; line-height: 1.6;">${content.replace(/\n/g, "<br>")}</div>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621</p>
        </div>
      </div>
    `,
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

  const announcementHtml = announcements.length > 0
    ? `<h3 style="color: #E5A830; margin-top: 20px;">Announcements</h3>` + announcements.map(a => `<p style="margin: 4px 0;">• ${a.title}</p>`).join("")
    : "";

  const projectHtml = projects.length > 0
    ? `<h3 style="color: #E5A830; margin-top: 20px;">Open Projects</h3>` + projects.map(p => `<p style="margin: 4px 0;">• ${p.title} — ${p.location}</p>`).join("")
    : "";

  const eventHtml = events.length > 0
    ? `<h3 style="color: #E5A830; margin-top: 20px;">Upcoming Events</h3>` + events.map(e => `<p style="margin: 4px 0;">• ${e.title} — ${e.eventDate}</p>`).join("")
    : "";

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: "NAMC NorCal Weekly Digest",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin: 0;">NAMC NorCal</h1>
          <p style="color: #666; margin: 4px 0 0;">Weekly Digest</p>
        </div>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <p style="color: #333; line-height: 1.6;">Here's what's happening at NAMC NorCal:</p>
          ${announcementHtml}
          ${projectHtml}
          ${eventHtml}
          ${!announcementHtml && !projectHtml && !eventHtml ? '<p style="color: #666;">No new updates this week.</p>' : ''}
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621</p>
        </div>
      </div>
    `,
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

  const { data, error } = await client.emails.send({
    from: fromEmail || "NAMC NorCal <noreply@resend.dev>",
    to: [toEmail],
    subject: "Your NAMC NorCal Member Portal Account is Ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin: 0;">NAMC NorCal</h1>
          <p style="color: #666; margin: 4px 0 0;">Member Portal</p>
        </div>
        
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1a1a1a; margin: 0 0 16px;">Welcome to the Member Portal!</h2>
          <p style="color: #333; line-height: 1.6;">Hi ${firstName},</p>
          <p style="color: #333; line-height: 1.6;">
            Your NAMC NorCal Member Portal account has been created and is ready for you to log in.
          </p>
          
          <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0;">
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
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621</p>
        </div>
      </div>
    `,
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
  messageBody: string
): Promise<{ sent: number; failed: number }> {
  const { client, fromEmail } = await getUncachableResendClient();
  const from = fromEmail || "NAMC NorCal <noreply@resend.dev>";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a; margin: 0;">NAMC NorCal</h1>
        <p style="color: #666; margin: 4px 0 0;">National Association of Minority Contractors</p>
      </div>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <div style="white-space: pre-wrap; color: #1a1a1a; line-height: 1.6;">${messageBody.replace(/\n/g, "<br/>")}</div>
      </div>
      <div style="text-align: center; color: #999; font-size: 12px;">
        <p>NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621</p>
        <p>You received this because you are an approved NAMC NorCal member.</p>
      </div>
    </div>
  `;

  const results = await Promise.all(
    emails.map(async (toEmail) => {
      try {
        const { error } = await client.emails.send({ from, to: [toEmail], subject, html });
        if (error) { console.error(`Failed to send to ${toEmail}:`, error.message); return false; }
        return true;
      } catch (err: any) {
        console.error(`Error sending to ${toEmail}:`, err.message);
        return false;
      }
    })
  );

  const sent = results.filter(Boolean).length;
  return { sent, failed: results.length - sent };
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">NAMC NorCal</h1>
            <p style="color: #666; margin: 4px 0 0;">National Association of Minority Contractors</p>
          </div>
          <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            ${htmlBody}
          </div>
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>NAMC NorCal &middot; 977 66th Ave, Oakland, CA 94621</p>
          </div>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message || "Send failed" };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send email" };
  }
}
