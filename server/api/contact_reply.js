import { neon } from "@neondatabase/serverless";
import { setCorsHeaders, verifyAuth } from "./utils.js";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return errorResponse(res, "Method not allowed", 405);
  }

  // Verify Admin Auth
  const session = await verifyAuth(req, sql);
  if (!session || session.role !== "admin") {
    return errorResponse(res, "Unauthorized", 401);
  }

  const { toEmail, subject, replyMessage, previousMessages } = req.body;

  if (!toEmail || !replyMessage) {
    return errorResponse(res, "Recipient email and message are required", 400);
  }

  try {
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
