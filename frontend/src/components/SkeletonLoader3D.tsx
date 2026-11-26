import React from 'react';

export interface SkeletonLoader3DProps {
  className?: string;
  label?: string;
  rows?: number;
  variant?: 'card' | 'table' | 'grid' | 'page';
  compact?: boolean;
}

// Return false immediately so views mount their real layout on frame 1
// and let the unified 100% opaque in-place skeleton cover them smoothly (zero double-delay!)
export const useSmoothSkeleton = (_durationMs: number = 0): boolean => {
  return false;
};

export const SkeletonLoader3D: React.FC<SkeletonLoader3DProps> = ({
  className = '',
  label = 'Loading Workspace...',
  rows = 3,
  variant = 'card',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`w-full rounded-xl border border-slate-700/50 bg-slate-900/70 p-3 space-y-2 overflow-hidden ${className}`}
        aria-busy="true"
      >
        <div className="h-3 w-1/3 rounded-md lt-skel-bar" />
        <div className="h-2.5 w-4/5 rounded-md lt-skel-bar" />
        <div className="h-2.5 w-2/3 rounded-md lt-skel-bar" />
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md p-5 space-y-4 overflow-hidden shadow-lg ${className}`}
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl lt-skel-bar shrink-0" />
          <div className="space-y-2">
            <div className="h-3.5 w-36 rounded-md lt-skel-bar" />
            <div className="h-2.5 w-24 rounded-md lt-skel-bar opacity-75" />
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80">
          {label}
        </span>
      </div>

      {variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: Math.max(3, rows) }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl lt-skel-bar" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {Array.from({ length: Math.max(2, rows) }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-xl lt-skel-bar"
              style={{ width: i === rows - 1 ? '72%' : '100%' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LABTRACK CALM, 100% FULL-PAGE OPAQUE SKELETON ENGINE (v7)
// - Auto-cleans previous instance on Vite HMR (changes ALWAYS take effect immediately)
// - Covers 100% of page height including deep bottom tables (StudentSessionsView, etc.)
// - Never tags raw <table> (tags its card wrapper instead so ::after renders cleanly)
// - Strict !important on ::after so component <style> blocks can never bleed through
// - Calm 1250ms nav / 1350ms F5 pacing + 2.4s liquid wave + 620ms velvet dissolve
// ============================================================================
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const WIN = window as unknown as {
    __ltSkeletonCleanup?: () => void;
    __ltPulseTransition?: () => void;
    __ltTriggerDashboardSkeleton?: (holdMs?: number) => void;
    __ltTriggerPortalSkeleton?: (holdMs?: number) => void;
  };

  // Tear down any previous version cleanly (fixes HMR not applying updates!)
  if (typeof WIN.__ltSkeletonCleanup === 'function') {
    WIN.__ltSkeletonCleanup();
  }

  [
    'labtrack-premium-3d-motion',
    'labtrack-premium-laser',
    'labtrack-capcut-3d-styles',
    'labtrack-capcut-laser',
    'labtrack-global-3d-skeleton-overlay',
    'labtrack-pc-preloader-overlay',
    'labtrack-3d-skeleton-style',
    'labtrack-top-laser-bar',
    'labtrack-calm-skeleton-styles',
    'labtrack-computer-preloader',
  ].forEach((id) => {
    const old = document.getElementById(id);
    if (old) old.remove();
  });

  document.body.classList.remove(
    'labtrack-skel3d-active',
    'labtrack-skel3d-fading',
    'labtrack-landing-3d-nav',
    'lt-skel-fading',
    'lt-soft-boot',
    'lt-boot-pending',
    'lt-boot-ready'
  );

  const isLandingPagePath = (pathname: string): boolean => {
    const p = (pathname || '/').toLowerCase();
    return (
      p === '/' ||
      p.startsWith('/laboratories') ||
      p.startsWith('/features') ||
      p.startsWith('/about')
    );
  };

  const isPortalPagePath = (pathname: string): boolean => {
    const p = (pathname || '/').toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/instructor') || p.startsWith('/student');
  };

  // 1. Inject Calm, 100% Opaque Full-Coverage Shimmer + PC Pre-Loader Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'labtrack-calm-skeleton-styles';
  styleEl.textContent = `
    @keyframes skel3dTupongWave {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    body.lt-boot-pending #root {
      opacity: 0 !important;
    }
    body.lt-boot-ready #root {
      opacity: 1 !important;
      transition: opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    .lt-skel-bar {
      background: linear-gradient(
        110deg,
        rgba(30, 41, 59, 0.72) 20%,
        rgba(56, 189, 248, 0.18) 48%,
        rgba(148, 163, 184, 0.24) 54%,
        rgba(30, 41, 59, 0.72) 80%
      );
      background-size: 240% 100%;
      animation: skel3dTupongWave 2.4s ease-in-out infinite;
    }

    /* 100% SOLID OPAQUE FULL-COVERAGE SKELETON (OVERRIDES COMPONENT ::after STYLES) */
    [data-lt-skel="card"],
    [data-lt-skel="leaf"] {
      overflow: hidden !important;
      isolation: isolate !important;
      color: transparent !important;
      user-select: none !important;
    }

    [data-lt-skel="leaf"] {
      border-radius: 10px !important;
    }

    [data-lt-skel-pos="added"] {
      position: relative !important;
    }

    [data-lt-skel="card"] > *,
    [data-lt-skel="leaf"] > * {
      opacity: 0 !important;
      transition: opacity 540ms cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    [data-lt-skel="card"]::after,
    [data-lt-skel="leaf"]::after {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: auto !important;
      height: auto !important;
      z-index: 9999 !important;
      pointer-events: none !important;
      border-radius: inherit !important;
      transform: none !important;
      background-color: #0f172a !important;
      background-image: linear-gradient(
        110deg,
        #0f172a 18%,
        #1e293b 38%,
        #2c4260 50%,
        #1e293b 62%,
        #0f172a 82%
      ) !important;
      background-size: 240% 100% !important;
      opacity: 1 !important;
      will-change: opacity, background-position;
      animation: skel3dTupongWave 2.4s ease-in-out infinite !important;
      transition: opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    [data-lt-skel][data-lt-skel-tone="light"]::after {
      background-color: #e2e8f0 !important;
      background-image: linear-gradient(
        110deg,
        #dde5ef 18%,
        #eef2f7 38%,
        #ffffff 50%,
        #eef2f7 62%,
        #dde5ef 82%
      ) !important;
      background-size: 240% 100% !important;
    }

    body.lt-skel-fading [data-lt-skel="card"],
    body.lt-skel-fading [data-lt-skel="leaf"] {
      color: inherit !important;
    }
    body.lt-skel-fading [data-lt-skel="card"] > *,
    body.lt-skel-fading [data-lt-skel="leaf"] > * {
      opacity: 1 !important;
    }
    body.lt-skel-fading [data-lt-skel="card"]::after,
    body.lt-skel-fading [data-lt-skel="leaf"]::after {
      opacity: 0 !important;
    }

    /* Sleek top progress laser */
    #labtrack-top-laser-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2.5px;
      z-index: 99998;
      pointer-events: none;
      transform-origin: left center;
      transform: scaleX(0);
      opacity: 0;
      background: linear-gradient(90deg, #2563eb 0%, #06b6d4 55%, #f59e0b 100%);
      box-shadow: 0 0 12px rgba(6, 182, 212, 0.65);
    }

    /* 3D PC MONITOR PRE-LOADER (LOGIN / SIGN-UP CLICKS ONLY) */
    @keyframes portal3dRingSpinA {
      0% { transform: rotateX(68deg) rotateY(16deg) rotateZ(0deg); }
      100% { transform: rotateX(68deg) rotateY(16deg) rotateZ(360deg); }
    }
    @keyframes portal3dRingSpinB {
      0% { transform: rotateX(64deg) rotateY(-24deg) rotateZ(360deg); }
      100% { transform: rotateX(64deg) rotateY(-24deg) rotateZ(0deg); }
    }
    @keyframes portal3dCorePulse {
      0%, 100% {
        transform: translate3d(0, 0, 0) scale(1);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.65), 0 0 24px rgba(6, 182, 212, 0.35);
      }
      50% {
        transform: translate3d(0, -4px, 0) scale(1.04);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.72), 0 0 36px rgba(56, 189, 248, 0.58);
      }
    }
    @keyframes portalProgressGlide {
      0% { transform: scaleX(0.05); }
      45% { transform: scaleX(0.62); }
      82% { transform: scaleX(0.90); }
      100% { transform: scaleX(1); }
    }

    #labtrack-computer-preloader {
      position: fixed;
      inset: 0;
      z-index: 99996;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 42%, rgba(15, 23, 42, 0.94) 0%, rgba(2, 6, 23, 0.98) 100%);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), visibility 420ms ease;
    }
    #labtrack-computer-preloader.is-open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .lt-preloader-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 34px 40px;
      border-radius: 28px;
      background: linear-gradient(155deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.94));
      border: 1px solid rgba(56, 189, 248, 0.28);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transform: translate3d(0, 10px, 0) scale(0.97);
      transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    #labtrack-computer-preloader.is-open .lt-preloader-card {
      transform: translate3d(0, 0, 0) scale(1);
    }
    .lt-preloader-orbit-box {
      position: relative;
      width: 124px;
      height: 124px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1000px;
      transform-style: preserve-3d;
    }
    .lt-preloader-ring-a {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      border: 2px solid rgba(34, 211, 238, 0.82);
      box-shadow: 0 0 20px rgba(34, 211, 238, 0.42);
      animation: portal3dRingSpinA 5.2s linear infinite;
    }
    .lt-preloader-ring-b {
      position: absolute;
      inset: 11px;
      border-radius: 9999px;
      border: 2px solid rgba(59, 130, 246, 0.85);
      box-shadow: 0 0 18px rgba(59, 130, 246, 0.42);
      animation: portal3dRingSpinB 6.8s linear infinite;
    }
    .lt-preloader-core {
      position: relative;
      z-index: 2;
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: linear-gradient(145deg, #1e293b 0%, #0f172a 55%, #020617 100%);
      border: 1.5px solid rgba(56, 189, 248, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: portal3dCorePulse 2.4s ease-in-out infinite;
    }
    .lt-preloader-badge {
      margin-top: 18px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(6, 182, 212, 0.14);
      border: 1px solid rgba(34, 211, 238, 0.32);
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #67e8f9;
      text-transform: uppercase;
    }
    .lt-preloader-title {
      margin-top: 12px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #f8fafc;
      text-transform: uppercase;
    }
    .lt-preloader-sub {
      margin-top: 5px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      color: #94a3b8;
    }
    .lt-preloader-bar {
      width: 224px;
      height: 4px;
      margin-top: 18px;
      border-radius: 9999px;
      background: rgba(51, 65, 85, 0.65);
      overflow: hidden;
    }
    .lt-preloader-bar-fill {
      width: 100%;
      height: 100%;
      border-radius: 9999px;
      transform-origin: left center;
      transform: scaleX(0);
      background: linear-gradient(90deg, #2563eb 0%, #06b6d4 60%, #fbbf24 100%);
    }
    #labtrack-computer-preloader.is-open .lt-preloader-bar-fill {
      animation: portalProgressGlide 1350ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
  `;
  document.head.appendChild(styleEl);

  const initialPath = (window.location.pathname || '/').toLowerCase();
  if (isPortalPagePath(initialPath) && document.readyState === 'loading') {
    document.body.classList.add('lt-boot-pending');
  }

  // 2. Top Laser Element
  const laser = document.createElement('div');
  laser.id = 'labtrack-top-laser-bar';
  document.body.appendChild(laser);

  let laserT1: number | null = null;
  let laserT2: number | null = null;
  const pulseLaserBar = () => {
    if (laserT1) window.clearTimeout(laserT1);
    if (laserT2) window.clearTimeout(laserT2);
    laser.style.transition = 'none';
    laser.style.opacity = '1';
    laser.style.transform = 'scaleX(0.06)';
    window.requestAnimationFrame(() => {
      laser.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out';
      laser.style.transform = 'scaleX(0.88)';
      laserT1 = window.setTimeout(() => {
        laser.style.transform = 'scaleX(1)';
        laser.style.opacity = '0';
        laserT2 = window.setTimeout(() => {
          laser.style.transition = 'none';
          laser.style.transform = 'scaleX(0)';
        }, 440);
      }, 720);
    });
  };

  // 3. 3D PC Pre-Loader Overlay (Login / Sign-up clicks ONLY)
  const preloader = document.createElement('div');
  preloader.id = 'labtrack-computer-preloader';
  preloader.innerHTML = `
    <div class="lt-preloader-card">
      <div class="lt-preloader-orbit-box">
        <div class="lt-preloader-ring-a"></div>
        <div class="lt-preloader-ring-b"></div>
        <div class="lt-preloader-core">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="3.5" width="19" height="13" rx="2.5" stroke="#38bdf8" stroke-width="1.8" fill="rgba(14,165,233,0.12)"/>
            <path d="M6.5 10H9L10.3 7.3L12.1 12.4L13.6 9.2L14.7 10H17.5" stroke="#67e8f9" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.5 20.5H15.5M12 16.5V20.5" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="lt-preloader-badge">JRMSU LABTRACK</div>
      <div id="lt-preloader-title" class="lt-preloader-title">Opening LabTrack Portal</div>
      <div id="lt-preloader-sub" class="lt-preloader-sub">Preparing secure authentication session...</div>
      <div class="lt-preloader-bar">
        <div class="lt-preloader-bar-fill"></div>
      </div>
    </div>
  `;
  document.body.appendChild(preloader);

  let preloaderTimer: number | null = null;
  const triggerComputerPreloader = (customTitle: string, customSub: string, holdMs = 1350) => {
    if (preloaderTimer) window.clearTimeout(preloaderTimer);

    const titleEl = document.getElementById('lt-preloader-title');
    const subEl = document.getElementById('lt-preloader-sub');
    if (titleEl) titleEl.textContent = customTitle;
    if (subEl) subEl.textContent = customSub;

    preloader.classList.remove('is-open');
    void preloader.offsetWidth;
    preloader.classList.add('is-open');

    preloaderTimer = window.setTimeout(() => {
      preloader.classList.remove('is-open');
    }, holdMs);
  };

  // 4. FULL-PAGE ZERO-THRASHING BATCHED READ -> BATCHED WRITE SKELETON ENGINE
  let skelHoldTimer: number | null = null;
  let skelCleanTimer: number | null = null;
  let catchupTimers: number[] = [];
  let scanRafId = 0;

  const clearCatchupTimers = () => {
    for (let i = 0; i < catchupTimers.length; i++) {
      window.clearTimeout(catchupTimers[i]);
    }
    catchupTimers = [];
  };

  const clearAllInPlaceSkeletonTags = () => {
    document.body.classList.remove('lt-skel-fading');
    const tagged = document.querySelectorAll('[data-lt-skel]');
    for (let i = 0; i < tagged.length; i++) {
      const el = tagged[i];
      el.removeAttribute('data-lt-skel');
      el.removeAttribute('data-lt-skel-tone');
      el.removeAttribute('data-lt-skel-pos');
    }
  };

  const isLightByClassFast = (el: HTMLElement): boolean => {
    const cls = typeof el.className === 'string' ? el.className : '';
    if (/\bbg-white\b|\bbg-slate-50\b|\bbg-slate-100\b|\bbg-gray-50\b|\bbg-blue-50\b|\bses-panel-3d\b/.test(cls)) {
      return true;
    }
    if (/\bbg-slate-9\d\d\b|\bbg-slate-8\d\d\b|\bbg-blue-9\d\d\b|\bfrom-slate-9\d\d\b|\bfrom-blue-9\d\d\b|\bfrom-emerald-\d+\b|\bfrom-amber-\d+\b|\bhud-panel-3d\b|\basean-glass/.test(cls)) {
      return false;
    }
    return Boolean(el.closest('.bg-white'));
  };

  type PendingTag = {
    el: HTMLElement;
    kind: 'card' | 'leaf';
    needsPos: boolean;
    isLight: boolean;
  };

  const tagVisiblePortalCards = (): number => {
    if (document.body.classList.contains('lt-skel-fading')) return 0;

    const scope: HTMLElement | null =
      document.querySelector('main') || document.getElementById('root');
    if (!scope) return 0;

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const toApply: PendingTag[] = [];
    const chosenCards: HTMLElement[] = [];

    // --- PHASE 1: PURE READS (All cards, table wrappers, banners, forms — NO bottom vh cutoff!) ---
    const cardNodes = scope.querySelectorAll<HTMLElement>(
      'section, article, form, [class*="rounded-3xl"], [class*="rounded-2xl"], [class*="rounded-xl"], [class*="rounded-lg"], [class*="rounded-md"]'
    );

    for (let i = 0; i < cardNodes.length && toApply.length < 180; i++) {
      const el = cardNodes[i];
      if (
        el.hasAttribute('data-lt-skel') ||
        el.tagName === 'TABLE' ||
        el.tagName === 'BUTTON' ||
        el.tagName === 'A' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SVG' ||
        el.closest('nav, aside, header, [data-ai-floating-root="true"], [role="dialog"], [data-lt-skel]')
      ) {
        continue;
      }

      if (chosenCards.some((parent) => parent.contains(el))) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width < 70 || rect.height < 32) {
        continue;
      }

      const cls = typeof el.className === 'string' ? el.className : '';
      if (/\bmin-h-screen\b/.test(cls)) continue;

      // Determine if this panel directly wraps a <table> (e.g. ses-panel-3d in StudentSessionsView)
      // NEVER skip a table wrapper panel — tagging it covers the ENTIRE table cleanly!
      const isTablePanel = Boolean(
        el.querySelector(':scope > table, :scope > div > table')
      );

      if (!isTablePanel && rect.height > vh * 0.82 && rect.width > vw * 0.62) {
        const innerBigCards = el.querySelectorAll(
          '[class*="rounded-3xl"], section, article'
        );
        if (innerBigCards.length >= 2) {
          continue;
        }
      }

      const pos = window.getComputedStyle(el).position;
      if (pos === 'fixed') continue;

      chosenCards.push(el);
      toApply.push({
        el,
        kind: 'card',
        needsPos: pos === 'static',
        isLight: isLightByClassFast(el),
      });
    }

    // --- PHASE 1B: Safety net for any <table> whose parent had no rounded class ---
    const tables = scope.querySelectorAll<HTMLElement>('table');
    for (let i = 0; i < tables.length; i++) {
      const tbl = tables[i];
      if (
        tbl.closest('nav, aside, header, [data-ai-floating-root="true"], [role="dialog"], [data-lt-skel]') ||
        chosenCards.some((parent) => parent.contains(tbl))
      ) {
        continue;
      }
      const wrapper = tbl.parentElement;
      if (wrapper && wrapper !== scope && !wrapper.hasAttribute('data-lt-skel')) {
        const wRect = wrapper.getBoundingClientRect();
        const pos = window.getComputedStyle(wrapper).position;
        if (wRect.width >= 100 && wRect.height >= 40 && pos !== 'fixed') {
          chosenCards.push(wrapper);
          toApply.push({
            el: wrapper,
            kind: 'card',
            needsPos: pos === 'static',
            isLight: isLightByClassFast(wrapper),
          });
        }
      }
    }

    // --- PHASE 2: PURE READS (Standalone Leaves outside cards) ---
    const leafNodes = scope.querySelectorAll<HTMLElement>(
      'h1, h2, h3, p, button, input, select, textarea, [class*="rounded-full"]'
    );

    for (let i = 0; i < leafNodes.length && toApply.length < 240; i++) {
      const el = leafNodes[i];
      if (
        el.hasAttribute('data-lt-skel') ||
        el.closest('nav, aside, header, [data-ai-floating-root="true"], [role="dialog"], [data-lt-skel]') ||
        chosenCards.some((parent) => parent.contains(el))
      ) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 14) {
        continue;
      }

      const pos = window.getComputedStyle(el).position;
      if (pos === 'fixed') continue;

      toApply.push({
        el,
        kind: 'leaf',
        needsPos: pos === 'static',
        isLight: isLightByClassFast(el),
      });
    }

    // --- PHASE 3: SINGLE BATCHED DOM WRITE ---
    for (let i = 0; i < toApply.length; i++) {
      const item = toApply[i];
      if (item.needsPos) {
        item.el.setAttribute('data-lt-skel-pos', 'added');
      }
      item.el.setAttribute('data-lt-skel', item.kind);
      if (item.isLight) {
        item.el.setAttribute('data-lt-skel-tone', 'light');
      }
    }

    return toApply.length;
  };

  const startFadeCycle = (holdMs: number) => {
    clearCatchupTimers();
    if (holdMs > 400) {
      [70, 220, 480].forEach((delay) => {
        if (delay < holdMs - 150) {
          catchupTimers.push(window.setTimeout(() => tagVisiblePortalCards(), delay));
        }
      });
    }

    skelHoldTimer = window.setTimeout(() => {
      clearCatchupTimers();
      document.body.classList.add('lt-skel-fading');
      skelCleanTimer = window.setTimeout(() => {
        clearAllInPlaceSkeletonTags();
      }, 640);
    }, holdMs);
  };

  const triggerInPlaceSmoothSkeleton = (holdMs = 1250, onFirstTagged?: () => void) => {
    const path = (window.location.pathname || '/').toLowerCase();
    if (!isPortalPagePath(path)) {
      onFirstTagged?.();
      return;
    }

    if (skelHoldTimer) window.clearTimeout(skelHoldTimer);
    if (skelCleanTimer) window.clearTimeout(skelCleanTimer);
    clearCatchupTimers();
    if (scanRafId) window.cancelAnimationFrame(scanRafId);
    clearAllInPlaceSkeletonTags();

    const immediateCount = tagVisiblePortalCards();
    if (immediateCount > 0) {
      onFirstTagged?.();
      startFadeCycle(holdMs);
      return;
    }

    let attempts = 0;
    const tryTag = () => {
      attempts++;
      const count = tagVisiblePortalCards();
      if (count > 0 || attempts >= 8) {
        onFirstTagged?.();
        if (count > 0) {
          startFadeCycle(holdMs);
        }
        return;
      }
      scanRafId = window.requestAnimationFrame(tryTag);
    };
    scanRafId = window.requestAnimationFrame(tryTag);
  };

  const triggerPortalNavSmooth = (holdMs = 1250) => {
    pulseLaserBar();
    triggerInPlaceSmoothSkeleton(holdMs);
  };

  WIN.__ltTriggerPortalSkeleton = triggerPortalNavSmooth;
  WIN.__ltTriggerDashboardSkeleton = triggerInPlaceSmoothSkeleton;
  WIN.__ltPulseTransition = () => triggerPortalNavSmooth(1250);

  // 5. Global Click Listener — ONLY for Landing Page Login/Sign-up PC Pre-Loader
  const onDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('[data-ai-floating-root="true"]')) return;

    const currentPath = (window.location.pathname || '/').toLowerCase();
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (link && isLandingPagePath(currentPath)) {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href.startsWith('/login')) {
        pulseLaserBar();
        triggerComputerPreloader(
          'Opening Login Portal',
          'Connecting to JRMSU LabTrack Authentication...',
          1350
        );
        return;
      }
      if (href.startsWith('/register')) {
        pulseLaserBar();
        triggerComputerPreloader(
          'Opening Registration Portal',
          'Preparing JRMSU LabTrack Account Setup...',
          1350
        );
      }
    }
  };
  document.addEventListener('click', onDocumentClick, { capture: true, passive: true });

  // 6. Zero-Flicker F5 Refresh Boot for Admin, Instructor & Student
  const finishBootReveal = () => {
    if (!document.body.classList.contains('lt-boot-pending')) return;
    document.body.classList.remove('lt-boot-pending');
    document.body.classList.add('lt-boot-ready');
    window.setTimeout(() => {
      document.body.classList.remove('lt-boot-ready');
    }, 600);
  };

  const runSmoothRefreshBoot = () => {
    const p = (window.location.pathname || '/').toLowerCase();
    if (isPortalPagePath(p)) {
      pulseLaserBar();
      triggerInPlaceSmoothSkeleton(1350, finishBootReveal);
      window.setTimeout(finishBootReveal, 260);
    } else {
      finishBootReveal();
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', runSmoothRefreshBoot, { once: true });
  } else {
    window.requestAnimationFrame(runSmoothRefreshBoot);
  }

  const onPopState = () => {
    const p = (window.location.pathname || '/').toLowerCase();
    if (isPortalPagePath(p)) {
      triggerPortalNavSmooth(1250);
    }
  };
  window.addEventListener('popstate', onPopState);

  // Register HMR cleanup so future edits always swap cleanly
  WIN.__ltSkeletonCleanup = () => {
    document.removeEventListener('click', onDocumentClick, { capture: true });
    window.removeEventListener('popstate', onPopState);
    if (skelHoldTimer) window.clearTimeout(skelHoldTimer);
    if (skelCleanTimer) window.clearTimeout(skelCleanTimer);
    if (preloaderTimer) window.clearTimeout(preloaderTimer);
    if (laserT1) window.clearTimeout(laserT1);
    if (laserT2) window.clearTimeout(laserT2);
    clearCatchupTimers();
    if (scanRafId) window.cancelAnimationFrame(scanRafId);
    clearAllInPlaceSkeletonTags();
  };
}

export default SkeletonLoader3D;
