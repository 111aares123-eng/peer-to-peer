import React, { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Monitor, X, ShieldCheck,
  CheckCircle2, Clock, AlertTriangle, MessageSquare, Flag,
  Eraser, PenTool, Share2, Award, Download
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';
import MaskedChatDrawer from './MaskedChatDrawer';

export default function LiveSessionRoom({
  booking,
  currentUser,
  socket,
  onClose,
  onCompleteSession,
  onClaimRefund,
  onReport
}) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [penColor, setPenColor] = useState('#6366f1');

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const elapsedSecsRemainder = elapsedSeconds % 60;
  const isWithinGuarantee = elapsedMins < 15;
  const guaranteeRemainingMins = Math.max(0, 14 - elapsedMins);

  // Canvas Whiteboard setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Socket listener for incoming whiteboard draws
    if (socket) {
      socket.emit('join_booking_room', { bookingId: booking.id, user: currentUser });

      socket.on('whiteboard_draw', (data) => {
        const { x, y, prevX, prevY, color, size, isEraser } = data;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? '#111827' : color;
        ctx.lineWidth = size;
        ctx.stroke();
      });

      socket.on('whiteboard_clear', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    return () => {
      if (socket) {
        socket.off('whiteboard_draw');
        socket.off('whiteboard_clear');
      }
    };
  }, [socket, booking.id]);

  const prevCoord = useRef({ x: 0, y: 0 });

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    isDrawing.current = true;
    prevCoord.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isEraser = tool === 'eraser';
    const size = isEraser ? 24 : 3;

    ctx.beginPath();
    ctx.moveTo(prevCoord.current.x, prevCoord.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#111827' : penColor;
    ctx.lineWidth = size;
    ctx.stroke();

    // Broadcast stroke
    if (socket) {
      socket.emit('whiteboard_draw', {
        bookingId: booking.id,
        drawData: {
          x,
          y,
          prevX: prevCoord.current.x,
          prevY: prevCoord.current.y,
          color: penColor,
          size,
          isEraser
        }
      });
    }

    prevCoord.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('whiteboard_clear', { bookingId: booking.id });
    }
  };

  const isStudent = currentUser?.id === booking.student_id;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden animate-in fade-in">
      {/* Top Session Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white tracking-wide">
              LIVE SESSION • {booking.subject_code}
            </span>
          </div>
          <span className="hidden sm:inline text-gray-500">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Elapsed: {elapsedMins.toString().padStart(2, '0')}:
              {elapsedSecsRemainder.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* 15-Minute Guarantee Indicator & Refund Claim */}
        <div className="flex items-center gap-2">
          {isWithinGuarantee ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                15-Min Guarantee: <strong>{guaranteeRemainingMins}m remaining</strong>
              </span>
              {isStudent && (
                <button
                  onClick={() => onClaimRefund(booking.id)}
                  className="ml-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-semibold transition-all"
                  title="Claim 100% instant refund from escrow"
                >
                  Claim Refund
                </button>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escrow Held Safely</span>
            </div>
          )}

          {/* Emergency Report Button */}
          <button
            onClick={() => onReport({ id: booking.tutor_id, name: booking.tutor_name })}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all"
            title="Emergency Safety Flag / Report"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Close/Exit */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Classroom Area: Left Video Tiles, Center Whiteboard, Right Chat (if open) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Tiles Sidebar */}
        <div className="w-64 sm:w-80 bg-gray-900/70 border-r border-gray-800 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
          {/* Tutor Video Tile */}
          <div className="relative rounded-2xl bg-gray-950 border border-indigo-500/20 overflow-hidden aspect-video flex items-center justify-center shadow-lg group">
            {cameraOn ? (
              <div className="w-full h-full relative bg-gradient-to-tr from-gray-900 via-indigo-950/40 to-gray-900 flex items-center justify-center">
                <img
                  src={booking.tutor_avatar || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200'}
                  alt={booking.tutor_name}
                  className="w-20 h-20 rounded-full border-2 border-indigo-400/40 shadow-xl object-cover animate-pulse"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                  <span>{booking.tutor_name} (Tutor)</span>
                  <Award className="w-3 h-3 text-amber-400" />
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">
                  <Mic className="w-3 h-3" />
                  <span>Speaking</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs flex flex-col items-center gap-1">
                <VideoOff className="w-6 h-6" />
                <span>Camera Paused</span>
              </div>
            )}
          </div>

          {/* Student Video Tile */}
          <div className="relative rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden aspect-video flex items-center justify-center shadow-lg">
            <div className="w-full h-full relative bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
              <img
                src={booking.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={booking.student_name}
                className="w-16 h-16 rounded-full border-2 border-emerald-400/40 shadow-xl object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium">
                {booking.student_name} (Student)
              </div>
            </div>
          </div>

          {/* Session Details Card */}
          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 text-xs space-y-2 mt-auto">
            <div className="font-semibold text-white">Session Information</div>
            <div className="text-[11px] text-gray-400 space-y-1">
              <div>Mode: <strong className="text-gray-200">{booking.session_mode === 'IN_APP_VIDEO' ? 'Virtual Video' : 'Logged Campus'}</strong></div>
              <div>Escrow Gross: <strong className="text-emerald-400">{formatCurrency(booking.total_amount)}</strong></div>
              <div>Platform Fee (12%): <strong className="text-gray-300">{formatCurrency(Math.round(booking.total_amount * 0.12))}</strong></div>
              <div>Tutor Payout (88%): <strong className="text-indigo-300">{formatCurrency(booking.total_amount - Math.round(booking.total_amount * 0.12))}</strong></div>
            </div>
          </div>
        </div>

        {/* Center: Collaborative Whiteboard */}
        <div className="flex-1 flex flex-col bg-gray-900 relative">
          {/* Whiteboard Toolbar */}
          <div className="bg-gray-800/80 border-b border-gray-700/80 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-300 hidden sm:inline">Whiteboard Tools:</span>
              <button
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
                  tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Pen</span>
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
                  tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Eraser</span>
              </button>

              {/* Color swatches */}
              <div className="flex items-center gap-1 ml-2">
                {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setPenColor(c);
                      setTool('pen');
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-4 h-4 rounded-full border border-gray-700 transition-transform ${
                      penColor === c && tool === 'pen' ? 'scale-125 ring-2 ring-indigo-400' : ''
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={clearWhiteboard}
                className="ml-2 px-2.5 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-[11px]"
              >
                Clear Board
              </button>
            </div>

            <div className="text-[11px] text-gray-400 hidden lg:inline">
              Real-time synced across both student & tutor
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative cursor-crosshair bg-[#0d1322]">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full block"
            />
          </div>

          {/* Bottom Live Controls Bar */}
          <div className="bg-gray-900 border-t border-gray-800 p-3 flex flex-wrap items-center justify-between gap-3">
            {/* AV Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2.5 rounded-xl transition-all ${
                  micOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={`p-2.5 rounded-xl transition-all ${
                  cameraOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setScreenSharing(!screenSharing)}
                className={`p-2.5 rounded-xl transition-all ${
                  screenSharing ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                title="Share Screen"
              >
                <Monitor className="w-4 h-4" />
              </button>

              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${
                  chatOpen ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                title="Toggle Masked Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>

            {/* Two-Party Completion & Escrow Release */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onCompleteSession(booking.id)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery & Release Escrow</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Embedded Masked Chat Drawer */}
        {chatOpen && (
          <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900 shrink-0">
            <MaskedChatDrawer
              bookingId={booking.id}
              currentUser={currentUser}
              recipientName={isStudent ? booking.tutor_name : booking.student_name}
              recipientId={isStudent ? booking.tutor_id : booking.student_id}
              socket={socket}
              onClose={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
