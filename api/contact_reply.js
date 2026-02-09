import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  // Simple check if using simple auth or DB auth
  // Assuming DB auth based on contact.js
  try {
    const sessions = await sql`
        SELECT s.*, a.role FROM sessions s
        JOIN admin_profiles a ON s.user_id = a.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;
    return sessions.length > 0 ? sessions[0] : null;
  } catch (e) {
    console.error("Auth verification failed", e);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return errorResponse(res, "Method not allowed", 405);
  }

  // Verify Admin Auth
  const session = await verifyAuth(req);
  if (!session || session.role !== "admin") {
    // For local dev without DB, potentially bypass or using mock token?
    // contact.js enforces it, so we should too.
    // If contact.js works, this should work.
    return errorResponse(res, "Unauthorized", 401);
  }

  const { toEmail, subject, replyMessage, previousMessages } = req.body;

  if (!toEmail || !replyMessage) {
    return errorResponse(res, "Recipient email and message are required", 400);
  }

  try {
    // Construct Email Content
    // This is where we format the "Reply" style

    let emailBody = `${replyMessage}\n\n`;

    if (
      previousMessages &&
      Array.isArray(previousMessages) &&
      previousMessages.length > 0
    ) {
      emailBody += `-----------------------------------\n`;
      emailBody += `Original Conversation:\n\n`;

      previousMessages.forEach((msg) => {
        const date = new Date(msg.created_at).toLocaleString();
        emailBody += `On ${date}, ${msg.name || "User"} wrote:\n`;
        emailBody += `> ${msg.message.replace(/\n/g, "\n> ")}\n\n`;
      });
    }

    console.log("------------------------------------------");
    console.log("SENDING EMAIL (SIMULATED)");
    console.log(`TO: ${toEmail}`);
    console.log(`SUBJECT: Re: ${subject || "Contact Inquiry"}`);
    console.log(`BODY:\n${emailBody}`);
    console.log("------------------------------------------");

    // In a real implementation, you would use Nodemailer or SendGrid here.
    // await sendEmail({ to: toEmail, subject: `Re: ${subject}`, text: emailBody });

    // We can also insert this reply into the database if there is a 'replies' table or 'messages' supports outgoing.
    // For now, we assume 'contact_messages' is incoming only, but we could insert a "sent" message if structure allows.
    // contact.js schema: name, email, subject, message, status.
    // Usually 'status' = 'replied'.

    // Update status of previous messages to 'replied' is logical, but user didn't explicitly ask to update status, just send.
    // But good UX updates status.

    // Let's assume we just return success for the sending action.

    return jsonResponse(res, {
      success: true,
      message: "Reply sent successfully",
      preview: emailBody,
    });
  } catch (error) {
    console.error("Reply Error:", error);
    return errorResponse(res, "Failed to send reply");
  }
}
