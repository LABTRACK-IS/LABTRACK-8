import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Monitor, ShieldCheck, Sparkles } from "lucide-react";

export type AuthRole = "admin" | "instructor";

interface AuthLayoutProps {
  role: AuthRole;
  children: React.ReactNode;
}

const ROLE_CONTENT = {
  admin: {
    title: "LABTRACK",
    subtitle: "Computer Laboratory Assistant & Asset Management System",
    tagline: "Monitor. Track. Manage.",
    accent: "text-blue-400",
  },
  instructor: {
    title: "LABTRACK",
    subtitle: "Faculty Portal for Lab Reservations & Student Monitoring",
    tagline: "Reserve. Monitor. Guide.",
    accent: "text-blue-400",
  },
};

const useSequentialTypewriter = (lines: string[], typeSpeed = 70, deleteSpeed = 25, pauseBetweenLines = 200, pauseAtEnd = 3000) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>(lines.map(() => ""));
  const [lineIndex, setLineIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPaused) {
      const currentPause = (lineIndex === lines.length - 1 && !isDeleting) || (lineIndex === 0 && isDeleting) ? pauseAtEnd : pauseBetweenLines;
      timer = setTimeout(() => setIsPaused(false), currentPause);
      return () => clearTimeout(timer);
    }
    const currentFullText = lines[lineIndex];
    const currentDisplayed = displayedLines[lineIndex];
    if (!isDeleting) {
      if (currentDisplayed.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayedLines(prev => {
            const next = [...prev];
            next[lineIndex] = currentFullText.slice(0, currentDisplayed.length + 1);
            return next;
          });
        }, typeSpeed);
      } else {
        if (lineIndex < lines.length - 1) { setLineIndex(lineIndex + 1); setIsPaused(true); }
        else { setIsDeleting(true); setIsPaused(true); }
      }
    } else {
      if (currentDisplayed.length > 0) {
        timer = setTimeout(() => {
          setDisplayedLines(prev => {
            const next = [...prev];
            next[lineIndex] = currentFullText.slice(0, currentDisplayed.length - 1);
            return next;
          });
        }, deleteSpeed);
      } else {
        if (lineIndex > 0) { setLineIndex(lineIndex - 1); setIsPaused(true); }
        else { setIsDeleting(false); setIsPaused(true); }
      }
    }
    return () => clearTimeout(timer);
  }, [displayedLines, lineIndex, isDeleting, isPaused, lines, typeSpeed, deleteSpeed, pauseBetweenLines, pauseAtEnd]);

  return displayedLines;
};

const TeamTrainMarquee: React.FC = () => (
  <div className="labtrack-train-text items-center gap-10 font-bold text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] whitespace-nowrap">
    <span>Project Manager: <strong className="text-blue-400">Mary Aprilieta Aligato</strong></span>
    <span>Programmer / Developer: <strong className="text-blue-400">John Sven Morales</strong></span>
    <span>UI/UX Designer: <strong className="text-blue-400">Dhan Lester Igdao</strong></span>
    <span>Database Designer: <strong className="text-blue-400">Aviegel Fernandez</strong></span>
    <span>Business/System Analyst: <strong className="text-blue-400">Cora Cayetano</strong></span>
    <span>Project Manager: <strong className="text-blue-400">Mary Aprilieta Aligato</strong></span>
    <span>Programmer / Developer: <strong className="text-blue-400">John Sven Morales</strong></span>
    <span>UI/UX Designer: <strong className="text-blue-400">Dhan Lester Igdao</strong></span>
    <span>Database Designer: <strong className="text-blue-400">Aviegel Fernandez</strong></span>
    <span>Business/System Analyst: <strong className="text-blue-400">Cora Cayetano</strong></span>
  </div>
);

const AnimatedDeveloperMascot: React.FC<{ isRegister: boolean; isForgot: boolean }> = ({ isRegister, isForgot }) => {
  const [waveBoost, setWaveBoost] = useState(false);

  return (
    <div
      onClick={() => {
        setWaveBoost(true);
        setTimeout(() => setWaveBoost(false), 1200);
      }}
      title="Click me to wave!"
      className="w-full flex items-end justify-end pr-2 sm:pr-4 -mb-5 relative z-30 select-none cursor-pointer group"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          key={isRegister ? 'reg-bubble' : isForgot ? 'forgot-bubble' : 'login-bubble'}
          className={`relative px-4 py-2 rounded-2xl backdrop-blur-2xl border shadow-[0_12px_30px_rgba(0,0,0,0.45)] animate-in zoom-in-90 slide-in-from-right-4 duration-500 ${
            isRegister
              ? 'bg-gradient-to-r from-emerald-600/95 via-teal-600/95 to-cyan-600/95 border-emerald-300/60 text-white'
              : isForgot
              ? 'bg-gradient-to-r from-amber-500/95 via-orange-500/95 to-amber-600/95 border-amber-300/70 text-white'
              : 'bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-cyan-500/95 border-cyan-300/60 text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wide drop-shadow">
              {isRegister
                ? 'HELLOW! Continue to Register'
                : isForgot
                ? 'OKY! Reset Password Here'
                : 'HI! Welcome to LabTrack'}
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/95 leading-tight mt-0.5">
            {isRegister
              ? 'Fill out the form below to create your account!'
              : isForgot
              ? 'Enter your Gmail below to get your 6-digit code!'
              : 'Sign in with your account & 6-digit PIN'}
          </p>
          <div
            className={`w-3 h-3 rotate-45 absolute -right-1.5 top-1/2 -translate-y-1/2 border-t border-r ${
              isRegister
                ? 'bg-cyan-600 border-emerald-300/60'
                : isForgot
                ? 'bg-amber-600 border-amber-300/70'
                : 'bg-cyan-500 border-cyan-300/60'
            }`}
          />
        </div>

        <div className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 mascot-float ${waveBoost ? 'scale-110' : ''} transition-transform duration-300`}>
          <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]">
            <defs>
              <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isRegister ? "#10b981" : "#38bdf8"} stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hoodieGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isRegister ? "#059669" : "#2563eb"} />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="laptopGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            <circle cx="85" cy="85" r="65" fill="url(#auraGrad)" className="animate-pulse" />

            <g className={waveBoost ? "mascot-wave-fast" : "mascot-wave"}>
              <path
                d="M52 96 C32 84, 24 66, 30 48"
                stroke="url(#hoodieGrad)"
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="30" cy="44" r="8.5" fill="#fed7aa" />
              {isForgot ? (
                <>
                  {/* OKY HAND GESTURE (*/}
                  <circle cx="28" cy="42" r="4.2" fill="none" stroke="#ea580°C" strokeWidth="2.2" />
                  <path d="M32 37 L35 28 M35 39 L39 31 M37 42 L42 36" stroke="#fdba74" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : (
                <path d="M24 38 L21 31 M28 36 L27 28 M33 36 L34 29 M37 39 L40 34" stroke="#fdba74" strokeWidth="2.8" strokeLinecap="round" />
              )}
            </g>

            <path d="M48 145 C48 104, 62 92, 85 92 C108 92, 122 104, 122 145 Z" fill="url(#hoodieGrad)" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M72 92 L85 110 L98 92" fill="#0f172a" />
            <path d="M77 95 L85 116 L93 95" stroke="#38bdf8" strokeWidth="2" fill="none" />

            <g className="mascot-head-nod">
              <rect x="77" y="80" width="16" height="16" rx="6" fill="#fed7aa" />
              <ellipse cx="85" cy="60" rx="26" ry="28" fill="#ffedd5" stroke="#fdba74" strokeWidth="1.2" />
              <path d="M56 58 C56 26, 114 26, 114 58" stroke="#0f172a" strokeWidth="5.5" fill="none" strokeLinecap="round" />
              <rect x="51" y="50" width="8" height="16" rx="4" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
              <rect x="111" y="50" width="8" height="16" rx="4" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M55 64 Q62 76 74 75" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="75" cy="75" r="2.5" fill="#10b981" />
              <path d="M58 52 C56 30, 74 22, 92 24 C108 26, 116 38, 112 52 C106 40, 94 36, 82 38 C70 40, 62 44, 58 52 Z" fill="#1e293b" />
              <rect x="65" y="50" width="17" height="12" rx="4" fill="#0f172a" fillOpacity="0.15" stroke="#0284c7" strokeWidth="2.2" />
              <rect x="88" y="50" width="17" height="12" rx="4" fill="#0f172a" fillOpacity="0.15" stroke="#0284c7" strokeWidth="2.2" />
              <line x1="82" y1="55" x2="88" y2="55" stroke="#0284c7" strokeWidth="2.2" />
              <ellipse cx="73.5" cy="56" rx="3" ry="3.4" fill="#0f172a" className="mascot-eye" />
              <ellipse cx="96.5" cy="56" rx="3" ry="3.4" fill="#0f172a" className="mascot-eye" />
              <circle cx="74.5" cy="54.8" r="1" fill="#ffffff" />
              <circle cx="97.5" cy="54.8" r="1" fill="#ffffff" />
              <path d="M77 69 Q85 76 93 69" stroke="#ea580°C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </g>

            <path d="M116 102 C128 112, 126 128, 108 130" stroke="url(#hoodieGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />

            <g>
              <polygon points="58,132 126,132 134,140 50,140" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" />
              <rect x="68" y="96" width="54" height="36" rx="5" fill="url(#laptopGrad)" stroke="#0f172a" strokeWidth="2" />
              <rect x="72" y="100" width="46" height="28" rx="3" fill="url(#screenGlow)" />
              <rect x="76" y="105" width="22" height="3" rx="1.5" fill="#67e8f9" className="animate-pulse" />
              <rect x="76" y="111" width="34" height="2.5" rx="1.2" fill="#e0f2fe" />
              <rect x="76" y="116" width="28" height="2.5" rx="1.2" fill="#34d399" />
              <rect x="76" y="121" width="18" height="2.5" rx="1.2" fill="#fde047" />
              <circle cx="108" cy="114" r="5" fill="#ffffff" fillOpacity="0.25" />
              <text x="108" y="116.5" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="monospace">LT</text>
              <circle cx="66" cy="126" r="6" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
              <circle cx="122" cy="126" r="6" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export const AuthLayout: React.FC<AuthLayoutProps> = ({ role, children }) => {
  const location = useLocation();
  const pathLower = (location.pathname || "").toLowerCase();
  const isRegisterPage = pathLower.includes("/register");
  const isForgotPage = pathLower.includes("/forgot");

  const content = ROLE_CONTENT[role] || ROLE_CONTENT.admin;
  const textLines = [content.title, content.subtitle, content.tagline];
  const [typedTitle, typedSubtitle, typedTagline] = useSequentialTypewriter(textLines);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row relative font-sans overflow-hidden bg-slate-950">
      <style>{`
        @keyframes labtrack-train-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .labtrack-train-text {
          display: flex;
          width: max-content;
          animation: labtrack-train-marquee 24s linear infinite;
          font-size: clamp(10.5px, 2.2vw, 12.5px);
        }
        .labtrack-train-mask {
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes dev-mascot-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes dev-hand-wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-18deg); }
          50% { transform: rotate(14deg); }
          75% { transform: rotate(-14deg); }
        }
        @keyframes dev-head-nod {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes dev-eye-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        .mascot-float {
          animation: dev-mascot-float 3.2s ease-in-out infinite;
        }
        .mascot-wave {
          transform-origin: 52px 96px;
          animation: dev-hand-wave 1.8s ease-in-out infinite;
        }
        .mascot-wave-fast {
          transform-origin: 52px 96px;
          animation: dev-hand-wave 0.45s ease-in-out infinite;
        }
        .mascot-head-nod {
          transform-origin: 85px 80px;
          animation: dev-head-nod 4s ease-in-out infinite;
        }
        .mascot-eye {
          transform-origin: center;
          animation: dev-eye-blink 4.5s infinite;
        }
      `}</style>

      {/* EXACT TOP-LEFT CIRCULAR BACK ARROW */}
      <Link
        to="/"
        title="Back to Landing Page"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-[9999] w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-slate-900/65 hover:bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-x-1 active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </Link>
      
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/images/sami.jpg')",
          filter: 'saturate(1.15) contrast(1.05)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-slate-950/55"></div>

      {/* LEFT SIDE (PC / Desktop Branding - Tinanggal na ang border-t line/guhit) */}
      <div className="hidden md:flex md:w-1/2 relative z-10 items-center justify-center p-12">
        <div className="text-white max-w-lg w-full space-y-6 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md">
              <Monitor className={`w-8 h-8 ${content.accent}`} />
            </div>
            <h1 className="text-3xl font-black tracking-widest drop-shadow-lg min-h-[40px]">
              {typedTitle}
              {typedTitle.length > 0 && <span className="animate-pulse text-blue-400">|</span>}
            </h1>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-white drop-shadow-md min-h-[64px]">
              {typedSubtitle}
              {typedSubtitle.length > 0 && typedSubtitle.length < content.subtitle.length && <span className="animate-pulse text-blue-400">|</span>}
            </h2>
            <p className={`text-sm font-sans tracking-[0.2em] uppercase font-bold ${content.accent} min-h-[20px]`}>
              {typedTagline}
              {typedTagline.length > 0 && typedTagline.length < content.tagline.length && <span className="animate-pulse text-blue-400">|</span>}
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2 text-white/60 text-xs font-sans">
            <ShieldCheck className="w-4 h-4" />
            <span>Secured by JRMSU IT Infrastructure</span>
          </div>
        </div>

        {/* NASA BABA NG SCREEN SA PC / DESKTOP */}
        <div className="absolute bottom-5 left-10 right-10 overflow-hidden labtrack-train-mask select-none pointer-events-none">
          <TeamTrainMarquee />
        </div>
      </div>

      {/* RIGHT SIDE (Form Area - Itinaas nang kaunti sa mobile gamit ang margin sa ibaba ng login box) */}
      <div className="w-full md:w-1/2 relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-8 pt-14 sm:pt-12 md:pt-8 overflow-y-auto no-scrollbar">
        <div className={`w-full ${isRegisterPage ? 'max-w-lg' : 'max-w-md'} my-auto py-2 md:py-0 animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center`}>
          
          <AnimatedDeveloperMascot isRegister={isRegisterPage} isForgot={isForgotPage} />

          <div className="w-full relative z-10">
            {children}
          </div>

          {/* MOBILE / IBANG GADGET: NAKA-MARGIN SA IBABA NG LOGIN BOX AT ITINAAS NANG KAUNTI */}
          <div className="md:hidden w-full max-w-[92vw] overflow-hidden mt-4 mb-6 labtrack-train-mask select-none pointer-events-none">
            <TeamTrainMarquee />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;


