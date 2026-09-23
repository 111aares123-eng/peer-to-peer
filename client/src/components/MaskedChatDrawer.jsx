import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldAlert, ShieldCheck, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';

const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b\d{10}\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const SOCIAL_REGEX = /(wa\.me|whatsapp|t\.me|telegram|discord\.gg|instagram\.com)[\w./?=&-]*/i;

export default function MaskedChatDrawer({
  bookingId,
  currentUser,
  recipientName,
  recipientId,
  socket,
  onClose
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveWarning, setLiveWarning] = useState(null);
  const messagesEndRef = useRef(null);

  // Load message history
  useEffect(() => {
    async function loadMessages() {
      try {
        const msgs = await api.getChatMessages(bookingId);
        setMessages(msgs || []);
      } catch (err) {
        console.error('Failed to load chat messages:', err);
      }
    }
    loadMessages();

    // Socket listener for new messages
    if (socket) {
      socket.on('new_message', (msg) => {
        if (msg.bookingId === bookingId) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    }

    return () => {
      if (socket) socket.off('new_message');
    };
  }, [bookingId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live client-side privacy detector
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (PHONE_REGEX.test(val) || EMAIL_REGEX.test(val) || SOCIAL_REGEX.test(val)) {
      setLiveWarning('Privacy Guard: Phone numbers, personal emails, and external messaging links are masked to protect you from off-platform scams.');
    } else {
      setLiveWarning(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const saved = await api.sendChatMessage(bookingId, {
        senderId: currentUser.id,
        recipientId: recipientId || 'other_user',
        message: inputText.trim()
      });

      setMessages((prev) => [...prev, saved]);
      setInputText('');
      setLiveWarning(null);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white">Masked Peer Chat</div>
            <div className="text-[10px] text-gray-400">with {recipientName}</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Safety Notice Banner */}
      <div className="p-2.5 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center gap-2 text-[10px] text-indigo-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>End-to-End Masked. Never share personal contact numbers off-platform.</span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            No messages yet. Send syllabus questions or coordination notes here.
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.sender_id === currentUser.id || m.senderId === currentUser.id;
            const hadContact = m.had_contact_info === 1 || m.hadContactInfo;
            const messageText = m.message || m.redacted_message;

            return (
              <div
                key={m.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-2.5 rounded-2xl text-xs ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700/60'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{messageText}</p>
                </div>

                {hadContact && (
                  <div className="flex items-center gap-1 text-[9px] text-amber-400 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Contact details masked by privacy filter</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Live Warning if typing phone/email */}
      {liveWarning && (
        <div className="p-2 bg-amber-500/10 border-t border-amber-500/30 text-[10px] text-amber-300 flex items-start gap-1.5 animate-in fade-in">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{liveWarning}</span>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-gray-800 bg-gray-900/90 flex gap-2">
        <input
          type="text"
          placeholder="Ask a question or discuss problem sets..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
