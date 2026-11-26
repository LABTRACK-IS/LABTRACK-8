import React, { useState, createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation } from "react-router-dom";
import { Cpu, Moon, Sun, Menu, X } from "lucide-react";
import { LandingLoadingScreen } from '@/components/LandingLoadingScreen';

const ThemeContext = createContext({ isDarkMode: false, toggleTheme: () => {} });
export const useLandingTheme = () => useContext(ThemeContext);

export const LandingLayout: React.FC = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLandingLoader, setShowLandingLoader] = useState(true);
  const [revealStage, setRevealStage] = useState<'waiting' | 'revealing' | 'ready'>('waiting');
  const [routeChangeCount, setRouteChangeCount] = useState(0);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setRouteChangeCount((c) => c + 1);
    }
  }, [location.pathname]);

  const handleRevealStart = useCallback(() => {
    setRevealStage('revealing');
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setShowLandingLoader(false);
    setRevealStage('ready');
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [frontPlayer, setFrontPlayer] = useState<'A' | 'B'>('A');
  const [videoSrc, setVideoSrc] = useState<string>("/assets/vedio/vedio.mp4");
  

  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const isSwitchingRef = useRef<boolean>(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // 1. I-load ang video sa RAM (Blob URL) isang beses lang para 0ms disk lag kapag naglu-loop
  useEffect(() => {
    let objectUrl = "";
    fetch("/assets/vedio/vedio.mp4")
      .then((res) => {
        if (!res.ok) throw new Error("Fallback to direct path");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
      })
      .catch(() => {
        setVideoSrc("/assets/vedio/vedio.mp4");
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  // 2. MAGAAN AT ZERO-LAG NA GPU CROSSFADE LOOP (Walang requestAnimationFrame overhead)
  useEffect(() => {
    const vidA = videoARef.current;
    const vidB = videoBRef.current;
    if (!vidA || !vidB) return;

    vidA.muted = true;
    vidB.muted = true;
    vidA.playsInline = true;
    vidB.playsInline = true;

    vidA.currentTime = 0;
    vidA.play().catch(() => {});

    const FADE_TIME = 0.75; // 0.75s overlap bago matapos para walang makikitang cut

    const onTimeUpdateA = () => {
      if (frontPlayer !== 'A' || isSwitchingRef.current || !vidA.duration) return;
      if (vidA.duration - vidA.currentTime <= FADE_TIME) {
        isSwitchingRef.current = true;
        vidB.currentTime = 0;
        vidB.play().catch(() => {});
        setFrontPlayer('B');
        window.setTimeout(() => {
          vidA.pause();
          vidA.currentTime = 0;
          isSwitchingRef.current = false;
        }, FADE_TIME * 1000);
      }
    };

    const onTimeUpdateB = () => {
      if (frontPlayer !== 'B' || isSwitchingRef.current || !vidB.duration) return;
      if (vidB.duration - vidB.currentTime <= FADE_TIME) {
        isSwitchingRef.current = true;
        vidA.currentTime = 0;
        vidA.play().catch(() => {});
        setFrontPlayer('A');
        window.setTimeout(() => {
          vidB.pause();
          vidB.currentTime = 0;
          isSwitchingRef.current = false;
        }, FADE_TIME * 1000);
      }
    };

    vidA.addEventListener('timeupdate', onTimeUpdateA);
    vidB.addEventListener('timeupdate', onTimeUpdateB);

    return () => {
      vidA.removeEventListener('timeupdate', onTimeUpdateA);
      vidB.removeEventListener('timeupdate', onTimeUpdateB);
    };
  }, [frontPlayer, videoSrc]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Laboratories", path: "/laboratories" },
    { name: "Features", path: "/features" },
    { name: "About Us", path: "/about" },
  ];

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {showLandingLoader && <LandingLoadingScreen onRevealStart={handleRevealStart} onComplete={handleLoaderComplete} />}
      <div className={`min-h-screen flex flex-col font-sans relative transition-colors duration-500 overflow-x-hidden lt-landing-${revealStage} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        
        {/* HARDWARE-ACCELERATED 3D TRANSITIONS (60FPS, ZERO LAG) */}
        <style>{`
          .scene-3d-viewport {
            perspective: 1400px;
          }

          @keyframes page-3d-smooth {
            0% {
              opacity: 0;
              transform: translate3d(0, 24px, -40px) rotateX(4deg);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) rotateX(0deg);
            }
          }

          .animate-page-3d {
            backface-visibility: hidden;
            will-change: transform, opacity;
            animation: page-3d-smooth 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .nav-3d-glass {
            box-shadow:
              0 12px 30px -8px rgba(0, 0, 0, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.16);
          }

          .btn-3d-pop {
            transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
            will-change: transform;
          }

          .btn-3d-pop:hover {
            transform: translate3d(0, -2.5px, 0) scale(1.03);
          }

          .btn-3d-pop:active {
            transform: translate3d(0, 1px, 0) scale(0.97);
          }

          .nav-link-3d {
            transition: transform 0.22s ease, color 0.22s ease;
          }

          .nav-link-3d:hover {
            transform: translate3d(0, -2px, 0);
          }
                /* === LT_CINEMATIC_TRANSITION_START === */
        /* 1. Cinema Camera Pull-Back on Background Video (preserves 700ms opacity A/B loop!) */
        .lt-landing-waiting video {
          transform: scale(1.10);
          filter: brightness(0.68) contrast(1.06) saturate(0.92);
        }
        .lt-landing-revealing video {
          transform: scale(1);
          filter: brightness(1) contrast(1) saturate(1);
          transition:
            transform 1600ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 1450ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 700ms linear !important;
          will-change: transform, filter, opacity;
        }

        /* 2. Glass Navbar Silky Drop-In */
        .lt-landing-waiting nav.nav-3d-glass {
          opacity: 0;
          transform: translate3d(0, -24px, 0);
        }
        .lt-landing-revealing nav.nav-3d-glass {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          transition:
            opacity 1150ms cubic-bezier(0.16, 1, 0.3, 1) 180ms,
            transform 1180ms cubic-bezier(0.16, 1, 0.3, 1) 180ms !important;
          will-change: transform, opacity;
        }

        /* 3. Hero Stage Cinematic Focus-Pull Rise */
        .lt-landing-waiting .lt-landing-stage {
          opacity: 0;
          transform: translate3d(0, 32px, 0) scale(0.985);
          filter: blur(8px);
        }
        .lt-landing-revealing .lt-landing-stage {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0px);
          transition:
            opacity 1300ms cubic-bezier(0.16, 1, 0.3, 1) 220ms,
            transform 1380ms cubic-bezier(0.16, 1, 0.3, 1) 220ms,
            filter 1250ms cubic-bezier(0.16, 1, 0.3, 1) 220ms !important;
          will-change: transform, opacity, filter;
        }

        /* 4. Top Luminous Reveal Sweep on Entry */
        @keyframes ltTopRevealBeam {
          0% { transform: scaleX(0); opacity: 0.95; }
          65% { transform: scaleX(1); opacity: 0.85; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        .lt-landing-revealing::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          z-index: 9998;
          pointer-events: none;
          transform-origin: left center;
          background: linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #fbbf24 100%);
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.85);
          animation: ltTopRevealBeam 1450ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* 5. Upgraded Silky Focus-Pull Glide between Landing Tabs (Home / Labs / Features / About) */
        @keyframes ltLandingRouteGlide {
          0% {
            opacity: 0;
            transform: translate3d(0, 22px, 0) scale(0.988);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0px);
          }
        }
        .animate-page-3d {
          animation: ltLandingRouteGlide 760ms cubic-bezier(0.16, 1, 0.3, 1) both !important;
          will-change: transform, opacity, filter;
        }
        /* === LT_CINEMATIC_TRANSITION_END === */
      `}</style>

        {/* ULTRA HD SEAMLESS DUAL-VIDEO BACKGROUND (PURE GPU, ZERO LAG, ZERO CUT) */}
        <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
          <video
            ref={videoARef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-linear ${
              frontPlayer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'opacity',
            }}
          />

          <video
            ref={videoBRef}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-linear ${
              frontPlayer === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'opacity',
            }}
          />
          
          {/* LIGHT OVERLAY PARA MALINAW ANG HD VIDEO */}
          {isDarkMode ? (
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#020617]/70 via-slate-950/20 to-slate-950/55" />
          ) : (
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-900/35" />
          )}
        </div>

        {/* 3D GLASS NAVBAR */}
        <nav className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between border-b transition-colors duration-500 nav-3d-glass ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/45 border-white/15'} backdrop-blur-md`}>
          
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group btn-3d-pop">
            <div className={`p-1.5 sm:p-2 rounded-xl transition-transform duration-500 group-hover:rotate-[360deg] ${isDarkMode ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.8)]' : 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.65)]'}`}>
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-sm sm:text-xl font-black tracking-widest uppercase text-white drop-shadow-md">
              LabTrack
            </span>
          </Link>

          <div className={`hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-white'}`}>
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`relative group py-1 nav-link-3d drop-shadow-md ${location.pathname === link.path ? 'text-blue-400' : 'hover:text-blue-200'}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-400 rounded-full transition-all duration-300 origin-left ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            ))}
          </div>

          {/* NAVIGATION ACTIONS */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-full transition-transform duration-300 hover:rotate-180 hover:scale-110 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-white/20 text-white'}`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <Link
              to="/register/admin"
              className={`btn-3d-pop text-[10px] sm:text-xs md:text-sm font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 border rounded-xl ${isDarkMode ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-white/40 text-white hover:bg-white/20'}`}
            >
              Sign-up
            </Link>

            <Link
              to="/login/admin"
              className="btn-3d-pop text-[10px] sm:text-xs md:text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-xl"
            >
              Login
            </Link>

            <button
              className="md:hidden p-1.5 sm:p-2 ml-0.5 text-white transition-transform active:scale-75 hover:bg-white/10 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </nav>

        {/* MOBILE SIDE DRAWER */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={`fixed top-0 right-0 h-full w-[240px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-sm font-black tracking-widest uppercase text-slate-900">LabTrack</span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                  location.pathname === link.path 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT WITH SMOOTH 3D PAGE TRANSITION */}
        <main className="flex-1 relative z-10 pt-[60px] sm:pt-[72px] scene-3d-viewport">
          <div key={location.pathname} className={`w-full h-full lt-landing-stage ${routeChangeCount > 0 ? 'animate-page-3d' : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default LandingLayout;
