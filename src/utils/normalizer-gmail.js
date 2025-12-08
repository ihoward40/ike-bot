// normalizer-gmail.js
// Converts raw Gmail → NormalizedMessage for Router v1

/**
 * Normalize a raw Gmail message payload into the standardized format
 * required by sintraprime-router-v1.js
 * 
 * @param {Object} raw - Raw Gmail API message object
 * @returns {Object} NormalizedMessage object
 */
function normalizeGmailMessage(raw) {
  if (!raw) throw new Error("Missing Gmail raw payload.");

  const payload = raw.payload || {};
  const headers = extractHeaders(payload.headers || []);

  return {
    id: raw.id,
    threadId: raw.threadId,
    source: "gmail",
    from: headers.from || "",
    to: headers.to ? headers.to.split(",").map(s => s.trim()) : [],
    replyTo: headers["reply-to"] || "",
    subject: headers.subject || "",
    date: headers.date || new Date().toISOString(),
    labels: raw.labelIds || [],
    headers,
    bodyText: extractBodyText(payload),
    bodyHtml: extractBodyHtml(payload)
  };
}

// -----------------------
// Header Helper
// -----------------------

/**
 * Extract headers from Gmail headers array into a simple object
 * @param {Array} headersArray - Array of header objects from Gmail
 * @returns {Object} Headers as key-value pairs
 */
function extractHeaders(headersArray) {
  const result = {};
  headersArray.forEach(h => {
    const name = h.name ? h.name.toLowerCase() : "";
    result[name] = h.value || "";
  });
  return result;
}

// -----------------------
// Body Helpers
// -----------------------

/**
 * Extract plain text body from Gmail payload
 * @param {Object} payload - Gmail message payload
 * @returns {string} Plain text body
 */
function extractBodyText(payload) {
  if (!payload) return "";
  
  // Case 1 — single-part email
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  
  // Case 2 — multipart email
  const part = getPartByMime(payload, "text/plain");
  if (part) return decodeBase64(part.body.data || "");
  
  return "";
}

/**
 * Extract HTML body from Gmail payload
 * @param {Object} payload - Gmail message payload
 * @returns {string} HTML body
 */
function extractBodyHtml(payload) {
  if (!payload) return "";
  const part = getPartByMime(payload, "text/html");
  if (part) return decodeBase64(part.body.data || "");
  return "";
}

/**
 * Find a specific MIME type part in the payload
 * @param {Object} payload - Gmail message payload
 * @param {string} mime - MIME type to find (e.g., "text/plain")
 * @returns {Object|null} The matching part or null
 */
function getPartByMime(payload, mime) {
  if (!payload.parts) return null;
  return payload.parts.find(p => p.mimeType === mime);
}

/**
 * Decode Gmail's base64url-encoded data
 * @param {string} data - Base64url-encoded string
 * @returns {string} Decoded UTF-8 string
 */
function decodeBase64(data) {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

module.exports = {
  normalizeGmailMessage
};
