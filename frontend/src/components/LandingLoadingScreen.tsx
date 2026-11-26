import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Cpu,
  Monitor,
  QrCode,
  ShieldCheck,
  Sparkles,
  Timer,
  Wifi,
} from 'lucide-react';

interface LandingLoadingScreenProps {
  onComplete: () => void;
  onRevealStart?: () => void;
}

const TOTAL_LOAD_DURATION_MS = 5200; // Calm, unhurried cinematic loading (~5.2s)

const LOADING_STAGES = [
  { min: 0, text: 'Booting JRMSU LabTrack 3D Telemetry Core...' },
  { min: 20, text: 'Mapping Campus Computer Laboratories & Active Workstations...' },
  { min: 45, text: 'Establishing Real-Time SignalR Heartbeat Channels...' },
  { min: 70, text: 'Verifying Anti-Proxy QR Check-In & Asset Security...' },
  { min: 90, text: 'Calibrating LabTrack AI Diagnostics & Analytics...' },
  { min: 100, text: 'All Systems Verified — Opening JRMSU LabTrack Portal...' },
];

const SYSTEM_TIPS = [
  'Students can scan the workstation QR code to start a verified computer laboratory session instantly.',
  'Live hardware heartbeat telemetry monitors active PCs in real time and automatically clears idle sessions.',
  'Instructors can inspect real-time room availability and schedule laboratory reservations without conflicts.',
  'Report hardware, software, or network issues directly to lab technicians with AI-assisted diagnostics.',
];

const PARTICLES = [
  { left: '6%', size: 3, delay: '0s', duration: '7.0s', color: 'rgba(56,189,248,0.9)' },
  { left: '14%', size: 2.5, delay: '1.3s', duration: '7.8s', color: 'rgba(251,191,36,0.9)' },
  { left: '23%', size: 4, delay: '0.5s', duration: '6.8s', color: 'rgba(34,211,238,0.85)' },
  { left: '33%', size: 2.5, delay: '2.1s', duration: '8.2s', color: 'rgba(96,165,250,0.85)' },
  { left: '44%', size: 3.5, delay: '0.8s', duration: '7.2s', color: 'rgba(251,191,36,0.85)' },
  { left: '56%', size: 4, delay: '1.6s', duration: '6.9s', color: 'rgba(34,211,238,0.9)' },
  { left: '67%', size: 3, delay: '0.3s', duration: '7.6s', color: 'rgba(250,204,21,0.9)' },
  { left: '78%', size: 3.5, delay: '1.9s', duration: '7.1s', color: 'rgba(56,189,248,0.9)' },
  { left: '88%', size: 2.5, delay: '1.0s', duration: '7.9s', color: 'rgba(251,191,36,0.9)' },
  { left: '95%', size: 3.5, delay: '2.3s', duration: '6.7s', color: 'rgba(34,211,238,0.9)' },
];

export const LandingLoadingScreen: React.FC<LandingLoadingScreenProps> = ({ onComplete, onRevealStart }) => {
  const [progress, setProgress] = useState(0);
  const [countdownSec, setCountdownSec] = useState(Math.ceil(TOTAL_LOAD_DURATION_MS / 1000));
  const [tipIndex, setTipIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onRevealStartRef = useRef(onRevealStart);
  onRevealStartRef.current = onRevealStart;
  const completedRef = useRef(false);

  useEffect(() => {
    const tipTimer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SYSTEM_TIPS.length);
    }, 2200);
    return () => window.clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let exitTimerA: number | null = null;
    let exitTimerB: number | null = null;
    let reached100 = false;
    const startTime = performance.now();

    const finishSafely = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };

    const triggerExit = () => {
      if (reached100) return;
      reached100 = true;
      setProgress(100);
      setCountdownSec(0);
      setIsReady(true);

      exitTimerA = window.setTimeout(() => {
        setIsExiting(true);
        onRevealStartRef.current?.();
        exitTimerB = window.setTimeout(() => {
          finishSafely();
        }, 1550);
      }, 420);
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / TOTAL_LOAD_DURATION_MS);
      const remainingMs = Math.max(0, TOTAL_LOAD_DURATION_MS - elapsed);

      const nextSec = Math.ceil(remainingMs / 1000);
      setCountdownSec((prev) => (prev !== nextSec ? nextSec : prev));

      // Continuous liquid-silk easing curve (0% -> 100% with zero speed stutter)
      const sineEase = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const smoothTail = 1 - Math.pow(1 - t, 2.15);
      const eased = sineEase * 0.58 + smoothTail * 0.42;

      setProgress(Math.min(100, Number((eased * 100).toFixed(1))));

      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        triggerExit();
      }
    };

    rafId = window.requestAnimationFrame(tick);

    const failsafeTimer = window.setTimeout(() => {
      triggerExit();
    }, TOTAL_LOAD_DURATION_MS + 1400);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(failsafeTimer);
      if (exitTimerA !== null) window.clearTimeout(exitTimerA);
      if (exitTimerB !== null) window.clearTimeout(exitTimerB);
    };
  }, []);

  const wholePercent = Math.floor(progress);
  const currentStage =
    [...LOADING_STAGES].reverse().find((s) => wholePercent >= s.min)?.text ||
    LOADING_STAGES[0].text;

  const showFinalCountdown = !isReady && countdownSec >= 1 && countdownSec <= 3;

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden select-none bg-[#020617] lt-loader-root ${
        isReady ? 'lt-loader-ready' : ''
      } ${isExiting ? 'lt-loader-exiting pointer-events-none' : ''}`}
      aria-label="Loading JRMSU LabTrack"
    >
      <style>{`
        /* === LT_LOADER_CINEMATIC_START === */
        @keyframes ltLoaderIntro {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes ltPortalRingBloom {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.35);
            border-width: 3px;
          }
          30% {
            opacity: 0.95;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(3.2);
            border-width: 1px;
          }
        }
        @keyframes ltHorizonFlareSweep {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scaleX(0.15) scaleY(0.6);
          }
          35% {
            opacity: 1;
            transform: translate(-50%, -50%) scaleX(1.15) scaleY(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scaleX(1.8) scaleY(0.2);
          }
        }
        .lt-loader-root {
          animation: ltLoaderIntro 550ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: opacity 1450ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity;
        }
        .lt-loader-root > div:not(.lt-cinema-fx) {
          transition:
            transform 1350ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 1200ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity, filter;
        }
        .lt-loader-root.lt-loader-exiting {
          opacity: 0 !important;
        }
        .lt-loader-root.lt-loader-exiting > div:not(.lt-cinema-fx) {
          transform: scale(1.07) translate3d(0, -12px, 0) !important;
          opacity: 0 !important;
          filter: blur(12px) !important;
        }

        /* Cinematic Top & Bottom Aperture Curtains (unhurried glide) */
        .lt-curtain-top,
        .lt-curtain-bottom {
          position: fixed;
          left: 0;
          right: 0;
          height: 50vh;
          pointer-events: none;
          z-index: 55;
          opacity: 0;
          transition:
            transform 1350ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 520ms ease;
          will-change: transform, opacity;
        }
        .lt-curtain-top {
          top: 0;
          background: linear-gradient(180deg, rgba(2, 6, 23, 0.96) 0%, rgba(15, 23, 42, 0.72) 85%, rgba(56, 189, 248, 0.25) 100%);
          border-bottom: 1px solid rgba(56, 189, 248, 0.38);
          transform: translate3d(0, 0, 0);
        }
        .lt-curtain-bottom {
          bottom: 0;
          background: linear-gradient(0deg, rgba(2, 6, 23, 0.96) 0%, rgba(15, 23, 42, 0.72) 85%, rgba(251, 191, 36, 0.22) 100%);
          border-top: 1px solid rgba(251, 191, 36, 0.32);
          transform: translate3d(0, 0, 0);
        }
        .lt-loader-root.lt-loader-exiting .lt-curtain-top {
          opacity: 1;
          transform: translate3d(0, -102%, 0);
        }
        .lt-loader-root.lt-loader-exiting .lt-curtain-bottom {
          opacity: 1;
          transform: translate3d(0, 102%, 0);
        }

        /* Expanding Portal Ring + Horizon Flare */
        .lt-portal-ring {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 340px;
          height: 340px;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 65;
          opacity: 0;
          border: 2px solid rgba(56, 189, 248, 0.85);
          box-shadow:
            0 0 40px rgba(56, 189, 248, 0.7),
            0 0 90px rgba(251, 191, 36, 0.45),
            inset 0 0 35px rgba(56, 189, 248, 0.35);
        }
        .lt-loader-root.lt-loader-ready .lt-portal-ring {
          animation: ltPortalRingBloom 1450ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lt-horizon-flare {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 85vw;
          height: 4px;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 66;
          opacity: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.9) 30%, #ffffff 50%, rgba(251, 191, 36, 0.9) 70%, transparent 100%);
          box-shadow: 0 0 32px rgba(56, 189, 248, 0.9), 0 0 70px rgba(251, 191, 36, 0.55);
        }
        .lt-loader-root.lt-loader-ready .lt-horizon-flare {
          animation: ltHorizonFlareSweep 1250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* === LT_LOADER_CINEMATIC_END === */
        @keyframes ltGridScroll {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 0 64px, 0 64px; }
        }
        @keyframes ltHorizonPulse {
          0%, 100% { opacity: 0.55; transform: scaleX(1); }
          50% { opacity: 0.95; transform: scaleX(1.06); }
        }
        @keyframes ltRingSpinA {
          0% { transform: rotateX(70deg) rotateY(14deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateY(14deg) rotateZ(360deg); }
        }
        @keyframes ltRingSpinB {
          0% { transform: rotateX(62deg) rotateY(-26deg) rotateZ(360deg); }
          100% { transform: rotateX(62deg) rotateY(-26deg) rotateZ(0deg); }
        }
        @keyframes ltRingSpinC {
          0% { transform: rotateX(22deg) rotateY(68deg) rotateZ(0deg); }
          100% { transform: rotateX(22deg) rotateY(68deg) rotateZ(360deg); }
        }
        @keyframes ltCoreFloat {
          0%, 100% { transform: translate3d(0, 0px, 26px) rotateY(-7deg) rotateX(4deg); }
          50% { transform: translate3d(0, -10px, 42px) rotateY(7deg) rotateX(-4deg); }
        }
        @keyframes ltCardFloatA {
          0%, 100% { transform: translate3d(0, 0px, 0) rotateY(14deg) rotateX(4deg); }
          50% { transform: translate3d(0, -10px, 16px) rotateY(10deg) rotateX(1deg); }
        }
        @keyframes ltCardFloatB {
          0%, 100% { transform: translate3d(0, 0px, 0) rotateY(-14deg) rotateX(4deg); }
          50% { transform: translate3d(0, -10px, 16px) rotateY(-10deg) rotateX(1deg); }
        }
        @keyframes ltRadarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ltShimmerSweep {
          0% { transform: translateX(-140%) skewX(-24deg); }
          100% { transform: translateX(340%) skewX(-24deg); }
        }
        @keyframes ltParticleRise {
          0% { transform: translate3d(0, 100vh, 0) scale(0.6); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.75; }
          100% { transform: translate3d(16px, -12vh, 0) scale(1.1); opacity: 0; }
        }
        @keyframes ltCountdownPop {
          0% { opacity: 0; transform: scale(1.4); }
          25% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(0.96); }
          100% { opacity: 0.4; transform: scale(0.88); }
        }
        .lt-3d-scene {
          perspective: 1100px;
          transform-style: preserve-3d;
        }
        .lt-floor-grid {
          position: absolute;
          left: -40%;
          right: -40%;
          bottom: -18%;
          height: 62%;
          background-image:
            linear-gradient(to right, rgba(34, 211, 238, 0.24) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.24) 1px, transparent 1px);
          background-size: 64px 64px;
          transform: perspective(520px) rotateX(75deg);
          transform-origin: center top;
          animation: ltGridScroll 2.2s linear infinite;
          mask-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.85) 38%, rgba(0, 0, 0, 0.95) 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.85) 38%, rgba(0, 0, 0, 0.95) 100%);
          will-change: background-position;
        }
        .lt-ceiling-grid {
          position: absolute;
          left: -40%;
          right: -40%;
          top: -22%;
          height: 44%;
          background-image:
            linear-gradient(to right, rgba(251, 191, 36, 0.13) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.14) 1px, transparent 1px);
          background-size: 64px 64px;
          transform: perspective(520px) rotateX(-74deg);
          transform-origin: center bottom;
          animation: ltGridScroll 3.2s linear infinite reverse;
          mask-image: linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.65) 45%, rgba(0, 0, 0, 0.85) 100%);
          -webkit-mask-image: linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.65) 45%, rgba(0, 0, 0, 0.85) 100%);
        }
        .lt-horizon-beam {
          animation: ltHorizonPulse 3.6s ease-in-out infinite;
        }
        .lt-ring-a {
          animation: ltRingSpinA 7.5s linear infinite;
          transform-style: preserve-3d;
        }
        .lt-ring-b {
          animation: ltRingSpinB 10.5s linear infinite;
          transform-style: preserve-3d;
        }
        .lt-ring-c {
          animation: ltRingSpinC 13s linear infinite;
          transform-style: preserve-3d;
        }
        .lt-core-float {
          animation: ltCoreFloat 4s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .lt-card-left {
          animation: ltCardFloatA 5.2s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .lt-card-right {
          animation: ltCardFloatB 5.6s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .lt-radar-sweep {
          animation: ltRadarSweep 9s linear infinite;
        }
        .lt-bar-shimmer {
          animation: ltShimmerSweep 1.75s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .lt-particle {
          animation-name: ltParticleRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        .lt-countdown-pop {
          animation: ltCountdownPop 0.94s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      {/* LT_CINEMA_FX_START */}
      <div className="lt-cinema-fx lt-curtain-top" aria-hidden="true" />
      <div className="lt-cinema-fx lt-curtain-bottom" aria-hidden="true" />
      <div className="lt-cinema-fx lt-portal-ring" aria-hidden="true" />
      <div className="lt-cinema-fx lt-horizon-flare" aria-hidden="true" />
      {/* LT_CINEMA_FX_END */}

      {/* 1. PURE VECTOR/GPU 3D CYBER-LABORATORY TELEMETRY ENVIRONMENT (INFINITE 4K SHARPNESS) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep Space Royal-Navy Radial Backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 85% 65% at 50% 42%, #0a1f44 0%, #050d21 48%, #020617 100%)',
          }}
        />

        {/* Crisp Volumetric Cyan & Gold Core Halo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 44%, rgba(34,211,238,0.18) 0%, rgba(37,99,235,0.10) 32%, rgba(251,191,36,0.06) 52%, transparent 72%)',
          }}
        />

        {/* 3D Animated Perspective Ceiling & Floor Telemetry Grids */}
        <div className="lt-ceiling-grid" />
        <div className="lt-floor-grid" />

        {/* Glowing Horizon Telemetry Beam */}
        <div
          className="absolute inset-x-0 top-[54%] h-[2px] lt-horizon-beam"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(34,211,238,0.45) 30%, rgba(251,191,36,0.75) 50%, rgba(34,211,238,0.45) 70%, transparent 95%)',
            boxShadow: '0 0 28px rgba(34,211,238,0.6), 0 0 55px rgba(251,191,36,0.35)',
          }}
        />

        {/* Giant Subtle Background Vector Radar Ring */}
        <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] rounded-full border border-cyan-400/12">
          <div className="absolute inset-10 rounded-full border border-dashed border-amber-300/15" />
          <div className="absolute inset-24 rounded-full border border-cyan-300/10" />
          <div
            className="absolute inset-0 rounded-full lt-radar-sweep"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(34,211,238,0.16) 0deg, transparent 55deg, transparent 360deg)',
            }}
          />
        </div>
      </div>

      {/* 2. FLOATING GOLDEN & CYAN TELEMETRY PARTICLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className="absolute rounded-full lt-particle"
            style={{
              left: p.left,
              bottom: '-18px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}`,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* 3. FLOATING 3D HOLOGRAPHIC LABTRACK SYSTEM NODES (ACCURATE TELEMETRY CARDS) */}
      <div className="hidden lg:block absolute inset-0 z-10 pointer-events-none lt-3d-scene">
        {/* Top-Left 3D Node */}
        <div className="absolute left-10 xl:left-16 top-[26%] w-56 p-3.5 rounded-xl bg-slate-900/75 border border-cyan-400/35 shadow-[0_14px_30px_rgba(0,0,0,0.55),0_0_20px_rgba(6,182,212,0.16)] lt-card-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5" /> Anti-Proxy QR
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>
          <p className="text-[11px] font-semibold text-white">Workstation Session Auth</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {wholePercent >= 70 ? 'STATUS: VERIFIED' : 'STATUS: CALIBRATING...'}
          </p>
        </div>

        {/* Bottom-Left 3D Node */}
        <div
          className="absolute left-14 xl:left-24 top-[54%] w-56 p-3.5 rounded-xl bg-slate-900/75 border border-blue-400/35 shadow-[0_14px_30px_rgba(0,0,0,0.55),0_0_20px_rgba(59,130,246,0.16)] lt-card-left"
          style={{ animationDelay: '0.8s' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-blue-300 uppercase tracking-wider">
              <Monitor className="w-3.5 h-3.5" /> Campus Labs
            </span>
            <span className="text-[10px] font-mono text-cyan-300">LIVE</span>
          </div>
          <p className="text-[11px] font-semibold text-white">JRMSU Dapitan Main</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {wholePercent >= 25 ? 'TOPOLOGY: SYNCED' : 'MAPPING ROOMS...'}
          </p>
        </div>

        {/* Top-Right 3D Node */}
        <div className="absolute right-10 xl:right-16 top-[26%] w-56 p-3.5 rounded-xl bg-slate-900/75 border border-amber-400/35 shadow-[0_14px_30px_rgba(0,0,0,0.55),0_0_20px_rgba(251,191,36,0.15)] lt-card-right">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" /> Telemetry Pulse
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
          </div>
          <p className="text-[11px] font-semibold text-white">Hardware Heartbeat</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {wholePercent >= 45 ? 'SIGNALR HUB: CONNECTED' : 'SYNCING STREAM...'}
          </p>
        </div>

        {/* Bottom-Right 3D Node */}
        <div
          className="absolute right-14 xl:right-24 top-[54%] w-56 p-3.5 rounded-xl bg-slate-900/75 border border-emerald-400/35 shadow-[0_14px_30px_rgba(0,0,0,0.55),0_0_20px_rgba(16,185,129,0.15)] lt-card-right"
          style={{ animationDelay: '1.1s' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
              <Wifi className="w-3.5 h-3.5" /> AI Diagnostics
            </span>
            <span className="text-[10px] font-mono text-emerald-300">ONLINE</span>
          </div>
          <p className="text-[11px] font-semibold text-white">LabTrack AI Assistant</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {wholePercent >= 88 ? 'ENGINE: READY' : 'INITIALIZING CORE...'}
          </p>
        </div>
      </div>

      {/* 4. TOP BAR HUD — VERSION & LIVE ML COUNTDOWN */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-400/45 shadow-[0_0_20px_rgba(6,182,212,0.18)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.18em] text-cyan-200 uppercase">
            JRMSU • LABTRACK v2.5.0
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-400/40">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] sm:text-xs font-mono font-semibold tracking-[0.15em] text-amber-200 uppercase">
              ANTI-PROXY TELEMETRY
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 border border-amber-400/65 shadow-[0_0_22px_rgba(251,191,36,0.25)]">
            <Timer className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.14em] text-amber-200 uppercase tabular-nums">
              {isReady ? 'READY' : `STARTING IN 0${countdownSec}s`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. CENTER 3D TRIPLE-RING GYROSCOPIC CREST, TITLE & 3-2-1 COUNTDOWN */}
      <div className="relative z-20 flex flex-col items-center justify-center h-[calc(100vh-230px)] sm:h-[calc(100vh-245px)] px-4 lt-3d-scene">
        <div className="relative flex items-center justify-center w-44 h-44 sm:w-56 sm:h-56 lt-3d-scene">
          {/* Ring 1 — Gold Outer Orbital */}
          <div
            className="absolute inset-0 rounded-full border-2 border-amber-300/85 lt-ring-a"
            style={{
              boxShadow:
                '0 0 26px rgba(251, 191, 36, 0.55), inset 0 0 16px rgba(251, 191, 36, 0.25)',
            }}
          >
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_16px_#fde68a]" />
          </div>

          {/* Ring 2 — Cyber-Cyan Middle Orbital */}
          <div
            className="absolute inset-3 sm:inset-4 rounded-full border-2 border-cyan-300/90 lt-ring-b"
            style={{
              boxShadow:
                '0 0 26px rgba(34, 211, 238, 0.6), inset 0 0 16px rgba(34, 211, 238, 0.25)',
            }}
          >
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-100 shadow-[0_0_16px_#a5f3fc]" />
          </div>

          {/* Ring 3 — Electric Blue Vertical Gyro */}
          <div
            className="absolute inset-7 sm:inset-9 rounded-full border border-blue-400/75 lt-ring-c"
            style={{
              boxShadow: '0 0 18px rgba(96, 165, 250, 0.5)',
            }}
          >
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-200 shadow-[0_0_12px_#93c5fd]" />
          </div>

          {/* Floating 3D Metallic Emblem Core */}
          <div className="relative z-10 flex items-center justify-center w-22 h-22 sm:w-26 sm:h-26 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border border-amber-300/80 shadow-[0_18px_40px_rgba(0,0,0,0.85),0_0_32px_rgba(56,189,248,0.5)] lt-core-float">
            <div className="absolute inset-1.5 rounded-xl border border-cyan-400/50 pointer-events-none" />
            {showFinalCountdown ? (
              <span
                key={countdownSec}
                className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 drop-shadow-[0_0_22px_rgba(251,191,36,0.95)] lt-countdown-pop"
              >
                {countdownSec}
              </span>
            ) : (
              <Cpu className="w-11 h-11 sm:w-12 sm:h-12 text-cyan-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.95)]" />
            )}
          </div>
        </div>

        {/* Ultra-Sharp Metallic Title Block */}
        <div className="mt-4 sm:mt-5 text-center">
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.26em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-amber-300"
            style={{
              filter: 'drop-shadow(0 6px 22px rgba(0, 0, 0, 0.95))',
            }}
          >
            LABTRACK
          </h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="h-[1px] w-10 sm:w-20 bg-gradient-to-r from-transparent via-amber-300 to-cyan-300" />
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-white">
              Jose Rizal Memorial State University
            </p>
            <span className="h-[1px] w-10 sm:w-20 bg-gradient-to-l from-transparent via-amber-300 to-cyan-300" />
          </div>
          <p className="mt-1.5 text-[10px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-cyan-200/95">
            {showFinalCountdown
              ? `Launching Control Center in ${countdownSec}...`
              : isReady
              ? 'Welcome to JRMSU LabTrack'
              : 'Intelligent Computer Laboratory Control & Telemetry Platform'}
          </p>
        </div>
      </div>

      {/* 6. BOTTOM ML-STYLE 3D GOLDEN-CYAN ENERGY PROGRESS BAR & SYSTEM TIPS */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 sm:px-10 md:px-16 pb-7 sm:pb-10 pt-8 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white truncate">
                {currentStage}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-mono font-bold tracking-widest uppercase text-amber-300 tabular-nums">
                {isReady ? '00s' : `0${countdownSec}s`}
              </span>
              <span className="text-lg sm:text-2xl font-mono font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-amber-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.75)]">
                {wholePercent}%
              </span>
            </div>
          </div>

          {/* 3D Beveled Metallic Progress Bar */}
          <div className="relative p-[3px] rounded-full bg-gradient-to-r from-cyan-400/90 via-amber-300/95 to-blue-500/90 shadow-[0_0_30px_rgba(6,182,212,0.45),0_10px_25px_rgba(0,0,0,0.85)]">
            <div className="relative h-3.5 sm:h-4 w-full rounded-full bg-slate-950 overflow-hidden shadow-inner">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none z-10"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 22px, rgba(255,255,255,0.45) 22px, rgba(255,255,255,0.45) 24px)',
                }}
              />

              <div
                className="relative h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-amber-300"
                style={{
                  width: `${progress}%`,
                  boxShadow:
                    '0 0 20px rgba(34, 211, 238, 0.9), 0 0 34px rgba(251, 191, 36, 0.65)',
                }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent lt-bar-shimmer" />
                </div>

                {progress > 1.5 && (
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white"
                    style={{
                      boxShadow:
                        '0 0 12px #ffffff, 0 0 22px #38bdf8, 0 0 36px #fbbf24',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-[11px] sm:text-xs text-slate-200 font-medium tracking-wide">
              <span className="inline-block mr-2 px-2 py-0.5 rounded bg-amber-500/25 border border-amber-300/55 text-amber-200 font-bold tracking-wider uppercase text-[10px]">
                LABTRACK GUIDE
              </span>
              {SYSTEM_TIPS[tipIndex]}
            </p>
            <span className="text-[10px] font-mono text-cyan-200 tracking-widest uppercase shrink-0">
              {isReady ? 'OPENING PORTAL' : 'SYNCING RESOURCES'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingLoadingScreen;
