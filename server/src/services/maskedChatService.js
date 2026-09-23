const { v4: uuidv4 } = require('uuid');

// Regular expressions to detect phone numbers, emails, and off-platform links
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b\d{10}\b|\b\d{5}[-.\s]\d{5}\b/gi;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const SOCIAL_LINKS_REGEX = /(wa\.me|whatsapp|t\.me|telegram|discord\.gg|instagram\.com|snapchat|zoom\.us|meet\.google|teams\.microsoft)[\w./?=&-]*/gi;
const DISGUISED_PHONE_REGEX = /(\d[\s.-]?){9,11}\d/g;

const REDACTION_NOTICE = '[REDACTED FOR SAFETY - KEEP ON PLATFORM]';

/**
 * Filters and masks sensitive contact information
 */
function maskMessage(text) {
  if (!text || typeof text !== 'string') {
    return { original: '', redacted: '', hadContactInfo: false };
  }

  let hadContactInfo = false;
  let redacted = text;

  if (PHONE_REGEX.test(redacted) || DISGUISED_PHONE_REGEX.test(redacted)) {
    hadContactInfo = true;
    redacted = redacted.replace(PHONE_REGEX, REDACTION_NOTICE);
    redacted = redacted.replace(DISGUISED_PHONE_REGEX, REDACTION_NOTICE);
  }

  if (EMAIL_REGEX.test(redacted)) {
    hadContactInfo = true;
    redacted = redacted.replace(EMAIL_REGEX, REDACTION_NOTICE);
  }

  if (SOCIAL_LINKS_REGEX.test(redacted)) {
    hadContactInfo = true;
    redacted = redacted.replace(SOCIAL_LINKS_REGEX, REDACTION_NOTICE);
  }

  return {
    original: text,
    redacted,
    hadContactInfo,
    warning: hadContactInfo 
      ? 'Safety Alert: Direct phone numbers, emails, and off-platform links are masked to protect peer privacy and escrow guarantee.'
      : null
  };
}

/**
 * Saves chat message to database with safety mask
 */
function saveChatMessage(db, { bookingId, senderId, recipientId, message }) {
  const result = maskMessage(message);
  const id = uuidv4();

  db.prepare(`
    INSERT INTO chat_messages (
      id, booking_id, sender_id, recipient_id, original_message, redacted_message, had_contact_info
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    bookingId,
    senderId,
    recipientId,
    result.original,
    result.redacted,
    result.hadContactInfo ? 1 : 0
  );

  return {
    id,
    bookingId,
    senderId,
    recipientId,
    message: result.redacted,
    hadContactInfo: result.hadContactInfo,
    warning: result.warning,
    createdAt: new Date().toISOString()
  };
}

/**
 * Fetch messages for a booking
 */
function getBookingMessages(db, bookingId) {
  return db.prepare(`
    SELECT m.id, m.booking_id, m.sender_id, m.recipient_id, m.redacted_message as message, 
           m.had_contact_info, m.created_at, u.name as sender_name, u.role as sender_role
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.booking_id = ?
    ORDER BY m.created_at ASC
  `).all(bookingId);
}

module.exports = {
  maskMessage,
  saveChatMessage,
  getBookingMessages
};
