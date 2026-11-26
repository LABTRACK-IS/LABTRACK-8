import React, { useState, useRef, useEffect, useId } from "react";
import { X, Send, Image as ImageIcon, Cpu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { AiApi } from "@/lib/api-client";
import { AiRichMessageRenderer } from "./AiRichMessageRenderer";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

const AI_IMAGE = "/assets/images/123.jpg";

// Accurate Futuristic AI Neural Core Icon (replaces generic Star/Sparkles)
const AiCoreIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* Outer Neural Hex Ring */}
    <path
      d="M12 2.2L19.8 6.7V15.7L12 20.2L4.2 15.7V6.7L12 2.2Z"
      stroke="#38bdf8"
      strokeWidth="1.6"
      fill="rgba(14, 165, 233, 0.14)"
    />
    {/* Circuit Pins */}
    <path
      d="M12 2.2V5.4M19.8 6.7L17 8.3M19.8 15.7L17 14.1M12 20.2V17M4.2 15.7L7 14.1M4.2 6.7L7 8.3"
      stroke="#67e8f9"
      strokeWidth="1.35"
      strokeLinecap="round"
    />
    {/* Inner Core Diamond */}
    <path
      d="M12 6.6L16.2 11.2L12 15.8L7.8 11.2L12 6.6Z"
      fill="#22d3ee"
      stroke="#e0f2fe"
      strokeWidth="1"
    />
    {/* Glowing Center Node */}
    <circle cx="12" cy="11.2" r="1.7" fill="#ffffff" />
  </svg>
);

// 3D Metallic Shaded Robot Head with Safe Unique SVG Gradients
const RobotHead = ({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const shellGradId = `rh-shell-${uid}`;
  const visorGradId = `rh-visor-${uid}`;
  const eyeGlowId = `rh-eye-${uid}`;

  return (
    <svg className={className} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id={shellGradId} x1="6" y1="7" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="45%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={visorGradId} x1="9" y1="12" x2="27" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#082f49" />
          <stop offset="50%" stopColor="#020617" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <radialGradient id={eyeGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0284c7" />
        </radialGradient>
      </defs>

      {/* 3D Plasma Antenna */}
      <rect x="16.6" y="3.2" width="2.8" height="4.4" rx="1.4" fill="#38bdf8" />
      <circle
        cx="18"
        cy="3"
        r="2.4"
        fill="#67e8f9"
        className={animated ? "ai-antenna-pulse" : ""}
      />
      <circle cx="17.3" cy="2.3" r="0.8" fill="#ffffff" />

      {/* 3D Side Audio/Sensor Pods */}
      <rect x="2.2" y="14.5" width="3.6" height="9" rx="1.8" fill="#0369a1" stroke="#38bdf8" strokeWidth="0.8" />
      <rect x="30.2" y="14.5" width="3.6" height="9" rx="1.8" fill="#0369a1" stroke="#38bdf8" strokeWidth="0.8" />

      {/* 3D Extruded Head Chassis Shadow Rim */}
      <rect x="6" y="9" width="24" height="22" rx="7.5" fill="#020617" opacity="0.7" />

      {/* Main 3D Metallic Head Shell */}
      <rect
        x="6"
        y="7.5"
        width="24"
        height="21.5"
        rx="7.5"
        fill={`url(#${shellGradId})`}
        stroke="#38bdf8"
        strokeWidth="1.75"
      />

      {/* Top 3D Metallic Specular Highlight */}
      <path
        d="M11.5 9.8H24.5"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Recessed 3D Holographic Visor */}
      <rect
        x="9.2"
        y="12.2"
        width="17.6"
        height="9.4"
        rx="3.8"
        fill={`url(#${visorGradId})`}
        stroke="rgba(56,189,248,0.55)"
        strokeWidth="1.1"
      />

      {/* Subtle Diagonal Glass Reflection on Visor */}
      <path
        d="M11.5 13.4L14.5 13.4L12.2 20.4L10.4 20.4Z"
        fill="rgba(255,255,255,0.08)"
      />

      {/* Glowing 3D Optical Eyes */}
      <g className={animated ? "ai-eye-blink" : ""}>
        <circle cx="14.2" cy="16.9" r="2.3" fill={`url(#${eyeGlowId})`} />
        <circle cx="14.9" cy="16.1" r="0.7" fill="#ffffff" />
        <circle cx="21.8" cy="16.9" r="2.3" fill={`url(#${eyeGlowId})`} />
        <circle cx="22.5" cy="16.1" r="0.7" fill="#ffffff" />
      </g>

      {/* Holographic Core Smile Bar */}
      <path
        d="M14 24.6C15.4 25.9 20.6 25.9 22 24.6"
        stroke="#67e8f9"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function GlobalAiChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("");

  const getRole = () => {
    const path = (location.pathname || "").toLowerCase();
    if (
      path === "/" ||
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/auth") ||
      path.startsWith("/forgot")
    ) {
      return "GUEST";
    }
    if (path.startsWith("/admin")) return "ADMIN";
    if (path.startsWith("/instructor")) return "INSTRUCTOR";
    if (path.startsWith("/student")) return "STUDENT";
    return "GUEST";
  };

  const currentRole = getRole();

  // Re-evaluate user identity on every route change; NEVER use cached storage names on GUEST/login/register pages
  useEffect(() => {
    if (currentRole === "GUEST") {
      setUserName("");
      return;
    }
    try {
      const token =
        sessionStorage.getItem("labtrack_token") ||
        localStorage.getItem("labtrack_token") ||
        localStorage.getItem("labtrack_access_token") ||
        localStorage.getItem("jrmsu_labtrack_auth_token");
      const raw =
        sessionStorage.getItem("labtrack_user") ||
        localStorage.getItem("labtrack_user");
      if (raw && (token || currentRole === "STUDENT")) {
        const parsed = JSON.parse(raw);
        const name =
          parsed.fullName ||
          parsed.name ||
          parsed.username ||
          parsed.email?.split("@")[0] ||
          "";
        // Ignore placeholder test strings like "xc" unless actually logged in as admin
        if (name && name.toLowerCase() !== "xc") {
          setUserName(name);
        } else {
          setUserName("");
        }
      } else {
        setUserName("");
      }
    } catch {
      setUserName("");
    }
  }, [location.pathname, currentRole]);

  // Reset conversation when switching between pages so each page has its own private AI context
  useEffect(() => {
    const path = (location.pathname || "/").toLowerCase();
    const nameStr = currentRole !== "GUEST" && userName ? ` ${userName}` : "";
    let greeting = "";

    if (path.startsWith("/register")) {
      greeting =
        "Hi there! Welcome to the JRMSU LabTrack Registration Page. I am your LabTrack AI Assistant. Need help creating your account or logging in?";
    } else if (path.startsWith("/login")) {
      greeting =
        "Hi there! Welcome to the JRMSU LabTrack Login Portal. I am your LabTrack AI Assistant. Ask me anything or let me help you sign in!";
    } else if (currentRole === "ADMIN") {
      greeting = `Hi Admin${nameStr}! I am your private Admin LabTrack AI Assistant. How can I help you manage the system today?`;
    } else if (currentRole === "INSTRUCTOR") {
      greeting = `Hi Instructor${nameStr}! I am your private Instructor LabTrack AI Assistant. How can I assist you with your classes and labs today?`;
    } else if (currentRole === "STUDENT") {
      greeting = `Hi Student${nameStr}! I am your private Student LabTrack AI Assistant. Ask me any question, check lab availability, or request media!`;
    } else {
      greeting =
        "Hi there! Welcome to JRMSU LabTrack. I am your LabTrack AI Assistant. How can I help you today?";
    }

    setMessages([{ id: "init-" + path, role: "bot", text: greeting }]);
  }, [location.pathname, currentRole, userName]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const sendPromptText = async (promptText: string) => {
    if (!promptText.trim() || isTyping) return;
    const cleanPrompt = promptText.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: cleanPrompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const safePathKey = (location.pathname || "/").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      const storageKey = `labtrack_ai_sid_${currentRole}_${safePathKey}`;
      let sid = sessionStorage.getItem(storageKey);
      if (!sid) {
        sid = `private-${currentRole.toLowerCase()}-${safePathKey}-${Date.now()}`;
        sessionStorage.setItem(storageKey, sid);
      }

      let botResponseText = "";
      try {
        const aiResult = await AiApi.chat({
          prompt: cleanPrompt,
          sessionId: sid,
          role: currentRole,
          userName: currentRole === "GUEST" ? "" : userName,
          path: location.pathname,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        });
        botResponseText = aiResult.response || "I have processed your request.";
      } catch {
        botResponseText =
          "I'm having trouble connecting to the AI backend right now. (Check if C# and Python servers are running).";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: botResponseText,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendPromptText(input);
  };

  const handleQuickImageRequest = () => {
    const trimmed = input.trim();
    if (trimmed) {
      sendPromptText("Show me a picture of " + trimmed);
    } else {
      sendPromptText(
        "Bigyan mo ako ng pic ng UI/UX ng system page kung saan ako ngayon"
      );
    }
  };

  return (
    <>
      <style>{`
        /* === TRIPLE-AXIS 3D GYROSCOPE & LEVITATION ANIMATIONS === */
        @keyframes ai3dLevitate {
          0%, 100% {
            transform: translate3d(0, 0px, 0) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translate3d(0, -9px, 10px) rotateX(8deg) rotateY(-5deg);
          }
        }
        @keyframes ai3dGroundShadow {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.65;
          }
          50% {
            transform: translateX(-50%) scale(0.72);
            opacity: 0.28;
          }
        }
        @keyframes ai3dOrbitA {
          0% { transform: rotateX(70deg) rotateY(16deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateY(16deg) rotateZ(360deg); }
        }
        @keyframes ai3dOrbitB {
          0% { transform: rotateX(62deg) rotateY(-30deg) rotateZ(360deg); }
          100% { transform: rotateX(62deg) rotateY(-30deg) rotateZ(0deg); }
        }
        @keyframes ai3dOrbitC {
          0% { transform: rotateX(48deg) rotateY(46deg) rotateZ(0deg); }
          100% { transform: rotateX(48deg) rotateY(46deg) rotateZ(360deg); }
        }
        @keyframes ai3dPulseAura {
          0% { transform: scale(0.95); opacity: 0.72; }
          100% { transform: scale(1.75); opacity: 0; }
        }
        @keyframes aiHoloSheen {
          0% { transform: translateX(-160%) skewX(-24deg); }
          100% { transform: translateX(300%) skewX(-24deg); }
        }
        @keyframes aiLaserLine {
          0% { transform: translateX(-100%); opacity: 0.35; }
          50% { opacity: 1; }
          100% { transform: translateX(220%); opacity: 0.35; }
        }
        @keyframes aiMsgPop3d {
          0% {
            opacity: 0;
            transform: perspective(800px) translate3d(0, 14px, -28px) rotateX(14deg) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: perspective(800px) translate3d(0, 0, 0) rotateX(0deg) scale(1);
          }
        }
        @keyframes aiEqualizerBar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
        @keyframes aiEyeBlink {
          0%, 44%, 48%, 94%, 100% { transform: scaleY(1); }
          46%, 96% { transform: scaleY(0.1); }
        }
        @keyframes aiAntennaGlow {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @keyframes aiCoreSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ai-3d-stage {
          perspective: 1400px;
        }

        /* === CRISP 3D SPRING UNFOLD PANEL (ZERO BLUR — 100% SHARP IMAGE) === */
        .ai-3d-panel {
          transform-origin: bottom right;
          transform-style: preserve-3d;
          transition:
            transform 460ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 300ms cubic-bezier(0.22, 1, 0.36, 1),
            visibility 460ms ease;
          will-change: transform, opacity;
        }
        .ai-3d-panel-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: perspective(1400px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1);
        }
        .ai-3d-panel-closed {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: perspective(1400px) translate3d(0, 34px, -85px) rotateX(16deg) rotateY(-8deg) scale(0.86);
        }

        /* 3D Extruded Hardware Chassis Shell */
        .ai-3d-card-shell {
          box-shadow:
            0 7px 0 #091326,
            0 30px 70px rgba(2, 6, 23, 0.85),
            0 0 0 1.5px rgba(56, 189, 248, 0.38),
            0 0 36px rgba(37, 99, 235, 0.28),
            inset 0 1.5px 0 rgba(255, 255, 255, 0.25);
        }

        /* 3D Floating Gyroscope Orb Launcher */
        .ai-3d-launcher-wrap {
          perspective: 950px;
          transform-style: preserve-3d;
          animation: ai3dLevitate 3.4s ease-in-out infinite;
        }
        .ai-3d-ground-shadow {
          position: absolute;
          left: 50%;
          bottom: -11px;
          width: 44px;
          height: 10px;
          border-radius: 9999px;
          background: radial-gradient(ellipse at center, rgba(6, 182, 212, 0.65) 0%, rgba(2, 6, 23, 0.7) 52%, transparent 80%);
          pointer-events: none;
          animation: ai3dGroundShadow 3.4s ease-in-out infinite;
        }
        .ai-3d-launcher-btn {
          transform-style: preserve-3d;
          background:
            radial-gradient(circle at 28% 20%, rgba(186, 230, 253, 0.6) 0%, transparent 42%),
            radial-gradient(circle at 75% 82%, rgba(6, 182, 212, 0.4) 0%, transparent 48%),
            linear-gradient(145deg, #2563eb 0%, #3730a3 52%, #020617 100%);
          box-shadow:
            0 6px 0 #172554,
            0 16px 32px rgba(2, 6, 23, 0.72),
            0 0 28px rgba(56, 189, 248, 0.52),
            inset 0 2px 3px rgba(255, 255, 255, 0.55),
            inset 0 -6px 12px rgba(2, 6, 23, 0.68);
          transition:
            transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 320ms ease;
        }
        .ai-3d-launcher-btn:hover {
          transform: translate3d(0, -4px, 16px) rotateX(12deg) rotateY(-10deg) scale(1.08);
          box-shadow:
            0 8px 0 #172554,
            0 22px 42px rgba(2, 6, 23, 0.78),
            0 0 42px rgba(34, 211, 238, 0.8),
            inset 0 2px 5px rgba(255, 255, 255, 0.68),
            inset 0 -6px 14px rgba(2, 6, 23, 0.7);
        }
        .ai-3d-launcher-btn:active {
          transform: translate3d(0, 3px, 0) scale(0.94);
          box-shadow:
            0 2px 0 #172554,
            0 8px 16px rgba(2, 6, 23, 0.65);
        }

        /* Triple 3D Orbital Rings + Orbiting Spark Nodes */
        .ai-orbit-ring-a {
          position: absolute;
          inset: -8px;
          border-radius: 9999px;
          border: 1.5px solid rgba(56, 189, 248, 0.85);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.55);
          pointer-events: none;
          animation: ai3dOrbitA 4.8s linear infinite;
        }
        .ai-orbit-ring-a::after {
          content: "";
          position: absolute;
          top: -3px;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #e0f2fe;
          box-shadow: 0 0 10px #38bdf8, 0 0 16px #38bdf8;
        }
        .ai-orbit-ring-b {
          position: absolute;
          inset: -12px;
          border-radius: 9999px;
          border: 1.5px solid rgba(99, 102, 241, 0.7);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.45);
          pointer-events: none;
          animation: ai3dOrbitB 6.4s linear infinite;
        }
        .ai-orbit-ring-c {
          position: absolute;
          inset: -16px;
          border-radius: 9999px;
          border: 1px dashed rgba(251, 191, 36, 0.58);
          pointer-events: none;
          animation: ai3dOrbitC 8.5s linear infinite;
        }
        .ai-orbit-ring-c::after {
          content: "";
          position: absolute;
          bottom: -2.5px;
          left: 50%;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: #fde68a;
          box-shadow: 0 0 10px #fbbf24;
        }
        .ai-pulse-aura {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid rgba(56, 189, 248, 0.58);
          pointer-events: none;
          animation: ai3dPulseAura 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        /* Holographic Header Sheen & Top Laser Scanner */
        .ai-header-sheen::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 34%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.14),
            transparent
          );
          pointer-events: none;
          animation: aiHoloSheen 6s ease-in-out infinite;
        }
        .ai-top-laser {
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #38bdf8, #e0f2fe, #38bdf8, transparent);
          box-shadow: 0 0 12px #38bdf8;
          pointer-events: none;
          animation: aiLaserLine 3.8s ease-in-out infinite;
        }

        /* 3D Elevated Message Bubbles */
        .ai-msg-pop {
          animation: aiMsgPop3d 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ai-bubble-user {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #0284c7 100%);
          box-shadow:
            0 4px 0 #1e3a8a,
            0 10px 22px rgba(37, 99, 235, 0.38),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.38);
          transition: transform 200ms ease;
        }
        .ai-bubble-user:hover {
          transform: translate3d(0, -1px, 6px);
        }
        .ai-bubble-bot {
          background: linear-gradient(155deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.94));
          box-shadow:
            0 4px 0 rgba(2, 6, 23, 0.85),
            0 10px 24px rgba(2, 6, 23, 0.52),
            inset 0 1px 0 rgba(56, 189, 248, 0.28);
          transition: transform 200ms ease;
        }
        .ai-bubble-bot:hover {
          transform: translate3d(0, -1px, 6px);
        }

        /* 3D Tactile Dock Buttons */
        .ai-3d-send-btn {
          box-shadow:
            0 4px 0 #1e3a8a,
            0 8px 18px rgba(37, 99, 235, 0.45),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.4);
          transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
        }
        .ai-3d-send-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1.5px);
        }
        .ai-3d-send-btn:active:not(:disabled) {
          transform: translateY(2.5px);
          box-shadow:
            0 1px 0 #1e3a8a,
            0 3px 8px rgba(37, 99, 235, 0.35);
        }
        .ai-3d-icon-btn {
          box-shadow:
            0 4px 0 #020617,
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
          transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
        }
        .ai-3d-icon-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .ai-3d-icon-btn:active:not(:disabled) {
          transform: translateY(2.5px);
          box-shadow: 0 1px 0 #020617;
        }

        .ai-eye-blink {
          transform-origin: center 16.9px;
          animation: aiEyeBlink 5s ease-in-out infinite;
        }
        .ai-antenna-pulse {
          animation: aiAntennaGlow 1.9s ease-in-out infinite;
        }
        .ai-core-spin {
          animation: aiCoreSpin 14s linear infinite;
        }
        .ai-eq-bar {
          transform-origin: center bottom;
          animation: aiEqualizerBar 0.95s ease-in-out infinite;
        }

        /* Sleek Thin Scrollbar */
        .ai-3d-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .ai-3d-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-3d-scroll::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.38);
          border-radius: 9999px;
        }
        .ai-3d-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.65);
        }
      `}</style>

      <div
        data-ai-floating-root="true"
        className={`ai-3d-stage fixed z-[9999] flex flex-col items-end gap-3.5 right-4 sm:right-6 ${
          currentRole === "STUDENT" ? "bottom-16 sm:bottom-6" : "bottom-6"
        }`}
      >
        {/* 3D EXTRUDED CHAT PANEL (100% CRISP ORIGINAL IMAGE QUALITY — ZERO BLUR) */}
        <div
          aria-hidden={!isOpen}
          className={`ai-3d-panel ${
            isOpen ? "ai-3d-panel-open" : "ai-3d-panel-closed"
          } ai-3d-card-shell w-[calc(100vw-2rem)] sm:w-[405px] max-w-[420px] h-[540px] max-h-[calc(100dvh-145px)] sm:max-h-[590px] rounded-[28px] overflow-hidden flex flex-col relative bg-slate-950`}
        >
          {/* 100% SHARP ORIGINAL BACKGROUND PICTURE (NO BLUR, NO DISTORTION) */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${AI_IMAGE}')` }}
          />
          {/* Clean Crisp Contrast Tint (Keeps image sharp & readable) */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/68 to-slate-950/85" />

          {/* 3D HUD Corner Brackets */}
          <span aria-hidden="true" className="pointer-events-none absolute top-2.5 left-2.5 z-20 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/75 rounded-tl-md" />
          <span aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 z-20 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/75 rounded-tr-md" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-md" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/60 rounded-br-md" />

          {/* Animated Top Laser Line */}
          <span aria-hidden="true" className="ai-top-laser z-30" />

          <div className="relative z-10 flex flex-col h-full w-full">
            {/* 3D HOLOGRAPHIC HEADER */}
            <div className="ai-header-sheen relative overflow-hidden shrink-0 bg-gradient-to-r from-slate-950/92 via-blue-950/85 to-slate-950/92 px-4 py-3.5 flex items-center justify-between border-b border-cyan-400/30 shadow-[0_6px_18px_rgba(2,6,23,0.55)]">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex items-center justify-center shadow-[0_4px_0_#020617,0_8px_18px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.32)] shrink-0">
                  <RobotHead className="w-8 h-8" animated />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_8px_#34d399]" />
                </div>
                <div>
                  <p className="text-white font-black text-sm tracking-tight flex items-center gap-1.5 leading-tight">
                    <span>LabTrack AI Assistant</span>
                    <AiCoreIcon className="w-4 h-4 ai-core-spin shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-[10px] font-bold tracking-wide shadow-inner">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {currentRole === "GUEST"
                        ? "Guest / Auth Guide"
                        : `${currentRole} Private Mode`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
                className="ai-3d-icon-btn text-slate-200 hover:text-white p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-400/30 transition-all duration-200 hover:rotate-90 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MESSAGES FEED */}
            <div className="ai-3d-scroll flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`ai-msg-pop flex items-end gap-2 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "bot" && (
                    <div className="w-8 h-8 rounded-xl shrink-0 mb-1 border border-cyan-400/45 bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center shadow-[0_3px_0_#020617,0_6px_12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)]">
                      <RobotHead className="w-6 h-6" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] sm:max-w-[80%] px-3.5 py-2.5 text-[11.5px] sm:text-xs leading-relaxed ${
                      m.role === "user"
                        ? "ai-bubble-user text-white rounded-2xl rounded-br-sm border border-cyan-300/35"
                        : "ai-bubble-bot text-slate-100 rounded-2xl rounded-bl-sm border border-cyan-400/30"
                    }`}
                  >
                    <AiRichMessageRenderer text={m.text} />
                  </div>
                </div>
              ))}

              {/* 3D HOLOGRAPHIC NEURAL WAVE TYPING INDICATOR */}
              {isTyping && (
                <div className="ai-msg-pop flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-xl shrink-0 mb-1 border border-cyan-400/55 bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center shadow-[0_3px_0_#020617,0_6px_14px_rgba(6,182,212,0.3)]">
                    <RobotHead className="w-6 h-6" animated />
                  </div>
                  <div className="ai-bubble-bot border border-cyan-400/35 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5">
                    <div className="flex items-end gap-1 h-4">
                      <span className="ai-eq-bar w-1 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" style={{ animationDelay: "0ms" }} />
                      <span className="ai-eq-bar w-1 h-4 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" style={{ animationDelay: "120ms" }} />
                      <span className="ai-eq-bar w-1 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" style={{ animationDelay: "240ms" }} />
                      <span className="ai-eq-bar w-1 h-4 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]" style={{ animationDelay: "360ms" }} />
                      <span className="ai-eq-bar w-1 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" style={{ animationDelay: "480ms" }} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/90">
                      Processing
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 3D RECESSED HARDWARE INPUT DOCK */}
            <form
              onSubmit={handleSend}
              className="shrink-0 p-2.5 sm:p-3 bg-slate-950/92 border-t border-cyan-400/30 flex items-center gap-2 shadow-[0_-6px_20px_rgba(2,6,23,0.55)]"
            >
              <button
                type="button"
                onClick={handleQuickImageRequest}
                disabled={isTyping}
                title="Capture UI/UX or Request Picture"
                className="ai-3d-icon-btn p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-400/35 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask any question, music, video, or pic..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-[16px] sm:text-xs rounded-2xl px-3.5 py-2.5 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all placeholder-slate-400 shadow-[inset_0_3px_7px_rgba(0,0,0,0.72)]"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="ai-3d-send-btn p-2.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 text-white rounded-2xl font-bold disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* TRIPLE-AXIS 3D GYROSCOPE LAUNCHER BUTTON */}
        <div className="flex items-center gap-3 group">
          {!isOpen && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/95 border border-cyan-400/45 text-cyan-100 text-[11px] font-bold tracking-wide shadow-[0_4px_0_#020617,0_12px_26px_rgba(2,6,23,0.65),0_0_16px_rgba(56,189,248,0.25)] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask LabTrack AI</span>
            </button>
          )}

          <div className="relative pb-2">
            {/* 3D Dynamic Floating Ground Shadow */}
            <span className="ai-3d-ground-shadow" aria-hidden="true" />

            <div className="ai-3d-launcher-wrap relative">
              {!isOpen && <span className="ai-pulse-aura" aria-hidden="true" />}
              <span className="ai-orbit-ring-a" aria-hidden="true" />
              <span className="ai-orbit-ring-b" aria-hidden="true" />
              <span className="ai-orbit-ring-c" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Close LabTrack AI Assistant" : "Ask LabTrack AI Assistant"}
                title="Ask LabTrack AI Assistant"
                className="ai-3d-launcher-btn relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white border-2 border-cyan-300/65 cursor-pointer overflow-visible"
              >
                {/* Glossy 3D Dome Specular Highlight */}
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-2.5 w-6 h-2.5 rounded-full bg-white/35 pointer-events-none -rotate-12"
                />

                {/* Smooth 3D Icon Flip (RobotHead <-> X) */}
                <span
                  className={`relative z-20 flex items-center justify-center transition-all duration-300 ${
                    isOpen ? "rotate-180 scale-90" : "rotate-0 scale-100"
                  }`}
                >
                  {isOpen ? (
                    <X className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-100 drop-shadow-[0_2px_8px_rgba(56,189,248,0.85)]" />
                  ) : (
                    <RobotHead
                      className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-[0_5px_10px_rgba(2,6,23,0.75)]"
                      animated
                    />
                  )}
                </span>

                {/* Live Online Dot */}
                <span className="absolute -top-0.5 -right-0.5 z-30 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-950 shadow-[0_0_8px_#34d399]" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}