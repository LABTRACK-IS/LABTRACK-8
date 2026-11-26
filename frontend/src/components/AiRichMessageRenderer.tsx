import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, ExternalLink, FileText, Film, Image as ImageIcon, Maximize2, Monitor, Music, Pause, Play, PlayCircle, Volume2, VolumeX, X } from 'lucide-react';

interface AiRichMessageRendererProps {
  text: string;
  className?: string;
}

type RichSegment =
  | { type: 'text'; content: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'system_page_pic'; route: string; pageTitle: string; role: string; wsCode: string; labName: string }
  | { type: 'audio'; title: string; artist: string; previewUrl: string; artworkUrl: string; trackIndex: number }
  | { type: 'video'; title: string; videoUrl: string; posterUrl: string }
  | { type: 'pdf'; title: string; subtitle: string }
  | { type: 'youtube'; query: string; label: string };

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Captures the ACTUAL live React UI/UX on screen by walking the visible DOM tree and painting
// every real box, card, sidebar, button, image, and text node at its exact screen coordinates!
const captureRealDomUiUxScreenshot = async (
  route: string,
  pageTitle: string,
  role: string,
  wsCode: string,
  labName: string
): Promise<string> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '/assets/images/lab-background.jpg';
  }

  // Temporarily hide floating Global AI overlay (if open) so we capture the clean underlying UI/UX
  const floatingChat = document.querySelector('[data-ai-floating-root="true"]') as HTMLElement | null;
  const prevVis = floatingChat ? floatingChat.style.visibility : '';
  if (floatingChat) {
    floatingChat.style.visibility = 'hidden';
  }

  try {
    const vw = Math.max(window.innerWidth || 1280, 360);
    const vh = Math.max(window.innerHeight || 720, 480);
    const headerBarH = 38;

    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh + headerBarH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '/assets/images/lab-background.jpg';

    // 1. Paint root background
    const bodyStyle = window.getComputedStyle(document.body);
    ctx.fillStyle =
      bodyStyle.backgroundColor && bodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? bodyStyle.backgroundColor
        : '#f8fafc';
    ctx.fillRect(0, headerBarH, vw, vh);

    // 2. Walk all visible DOM elements in paint order and render their actual computed UI/UX styles
    const allElements = Array.from(document.querySelectorAll('body *'));
    for (const el of allElements) {
      if (!(el instanceof HTMLElement || el instanceof SVGElement)) continue;
      if (floatingChat && floatingChat.contains(el)) continue;

      const style = window.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity || '1') < 0.05
      ) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) continue;

      const x = rect.left;
      const y = rect.top + headerBarH;
      const w = rect.width;
      const h = rect.height;
      const radius = parseFloat(style.borderTopLeftRadius || '0') || 0;

      // Paint background color or gradient approximation
      const bg = style.backgroundColor;
      const bgImg = style.backgroundImage;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        ctx.save();
        drawRoundedRect(ctx, x, y, w, h, radius);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.restore();
      } else if (bgImg && bgImg.includes('gradient')) {
        ctx.save();
        drawRoundedRect(ctx, x, y, w, h, radius);
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        if (bgImg.includes('30, 83, 82') || bgImg.includes('#1e5352')) {
          grad.addColorStop(0, '#1e5352');
          grad.addColorStop(1, '#133837');
        } else {
          grad.addColorStop(0, '#2563eb');
          grad.addColorStop(1, '#4f46e5');
        }
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Paint borders
      const bw = parseFloat(style.borderTopWidth || '0') || 0;
      const bc = style.borderTopColor;
      if (bw > 0 && bc && bc !== 'rgba(0, 0, 0, 0)' && bc !== 'transparent') {
        ctx.save();
        drawRoundedRect(ctx, x, y, w, h, radius);
        ctx.strokeStyle = bc;
        ctx.lineWidth = Math.min(bw, 3);
        ctx.stroke();
        ctx.restore();
      }

      // Paint <img> elements
      if (el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0) {
        try {
          ctx.save();
          drawRoundedRect(ctx, x, y, w, h, radius);
          ctx.clip();
          ctx.drawImage(el, x, y, w, h);
          ctx.restore();
        } catch {}
      }

      // Paint <input> / <textarea> / <select> current values or placeholders
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const val = el.value || el.placeholder || '';
        if (val) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 6, y, Math.max(0, w - 12), h);
          ctx.clip();
          ctx.fillStyle = el.value ? style.color || '#1e293b' : '#94a3b8';
          ctx.font = `${style.fontWeight || '500'} ${style.fontSize || '12px'} ${style.fontFamily || 'sans-serif'}`;
          ctx.textBaseline = 'middle';
          ctx.fillText(val, x + 12, y + h / 2);
          ctx.restore();
        }
      }

      // Paint direct text nodes at their exact range bounding boxes
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          const rawTxt = (node.textContent || '').replace(/\s+/g, ' ').trim();
          if (!rawTxt) continue;
          try {
            const range = document.createRange();
            range.selectNodeContents(node);
            const tRect = range.getBoundingClientRect();
            if (tRect.width > 1 && tRect.height > 1 && tRect.top < vh && tRect.bottom > 0) {
              ctx.save();
              ctx.fillStyle = style.color || '#0f172a';
              ctx.font = `${style.fontWeight || '400'} ${style.fontSize || '12px'} ${style.fontFamily || 'sans-serif'}`;
              ctx.textBaseline = 'top';
              const maxW = Math.max(40, rect.width - 4);
              ctx.fillText(rawTxt, tRect.left, tRect.top + headerBarH + 1, maxW);
              ctx.restore();
            }
          } catch {}
        }
      }
    }

    // 3. Draw top browser/system header bar showing the exact URL and active workstation
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, vw, headerBarH);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(18, 19, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(34, 19, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(50, 19, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, 72, 7, Math.min(vw - 240, 680), 24, 6);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${window.location.href}`, 84, 19);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`● LIVE UI/UX (${role} • ${wsCode})`, Math.max(vw - 160, 760), 19);

    return canvas.toDataURL('image/png');
  } catch {
    return '/assets/images/lab-background.jpg';
  } finally {
    if (floatingChat) {
      floatingChat.style.visibility = prevVis;
    }
  }
};

const LiveSystemPageScreenshotCard: React.FC<{
  route: string;
  pageTitle: string;
  role: string;
  wsCode: string;
  labName: string;
  onPreview: (src: string, alt: string) => void;
}> = ({ route, pageTitle, role, wsCode, labName, onPreview }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  const takeSnapshot = () => {
    captureRealDomUiUxScreenshot(route, pageTitle, role, wsCode, labName).then((url) => {
      setDataUrl(url);
    });
  };

  useEffect(() => {
    const t = window.setTimeout(takeSnapshot, 60);
    return () => window.clearTimeout(t);
  }, [route, pageTitle, role, wsCode, labName]);

  const caption = `Live UI/UX Capture: ${pageTitle} (${route} • ${wsCode})`;

  return (
    <div className="my-2 rounded-2xl overflow-hidden border border-cyan-400/50 bg-slate-950 shadow-xl group relative">
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10.5px] text-cyan-300 font-extrabold">
        <span className="flex items-center gap-1.5 truncate">
          <Monitor className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Actual Live Page UI/UX ({route})</span>
        </span>
        <button
          type="button"
          onClick={takeSnapshot}
          className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[9.5px] cursor-pointer transition"
          title="Recapture current screen UI"
        >
          Refresh UI Capture
        </button>
      </div>
      <div className="relative min-h-[150px] bg-slate-900 flex items-center justify-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={caption}
            onClick={() => onPreview(dataUrl, caption)}
            className="w-full max-h-72 object-contain bg-slate-950 cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="py-8 text-xs text-slate-400 flex items-center gap-2">
            <Camera className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>Capturing live page UI/UX...</span>
          </div>
        )}
        {dataUrl && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPreview(dataUrl, caption)}
              className="p-1.5 rounded-lg bg-slate-950/85 text-white hover:bg-cyan-600 transition cursor-pointer shadow"
              title="Zoom Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <a
              href={dataUrl}
              download={`labtrack-ui-${role.toLowerCase()}-${Date.now()}.png`}
              className="p-1.5 rounded-lg bg-slate-950/85 text-white hover:bg-emerald-600 transition cursor-pointer shadow"
              title="Download UI/UX Screenshot"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
        <span className="truncate font-semibold">{caption}</span>
        {dataUrl && (
          <a
            href={dataUrl}
            download={`labtrack-ui-${role.toLowerCase()}.png`}
            className="text-cyan-400 hover:underline font-bold shrink-0 ml-2"
          >
            Download PNG
          </a>
        )}
      </div>
    </div>
  );
};

const downloadRealPdfFile = (title: string, bodyText: string) => {
  const cleanLines = bodyText
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[(AUDIO|VIDEO|PDF|YOUTUBE|SYSTEM_PAGE_PIC):[^\]]+\]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const wrappedLines: string[] = [
    `JRMSU LABTRACK OFFICIAL AI DOCUMENT`,
    `Title: ${title}`,
    `Generated: ${new Date().toLocaleString()}`,
    `------------------------------------------------------------------------`,
    '',
  ];

  cleanLines.forEach((line) => {
    let rem = line;
    while (rem.length > 78) {
      wrappedLines.push(rem.slice(0, 78));
      rem = rem.slice(78);
    }
    wrappedLines.push(rem);
  });

  const escPdf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let streamContent = 'BT\n/F1 10 Tf\n50 760 Td\n14 TL\n';
  wrappedLines.slice(0, 46).forEach((l) => {
    streamContent += `(${escPdf(l)}) Tj T*\n`;
  });
  streamContent += 'ET';

  const objects: string[] = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj');
  objects.push(`4 0 obj << /Length ${streamContent.length} >> stream\n${streamContent}\nendstream endobj`);
  objects.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'labtrack-report'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};

const InteractiveAudioPlayerCard: React.FC<{
  title: string;
  artist: string;
  previewUrl: string;
  artworkUrl: string;
  playerId: string;
  nextPlayerId?: string;
}> = ({ title, artist, previewUrl, artworkUrl, playerId, nextPlayerId }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);
  const [usingSynth, setUsingSynth] = useState(previewUrl.startsWith('synth://'));

  const stopSynth = () => {
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    const onGlobalPlay = (ev: Event) => {
      const customEv = ev as CustomEvent<{ id: string }>;
      if (customEv.detail?.id !== playerId) {
        if (audioRef.current) audioRef.current.pause();
        stopSynth();
        setIsPlaying(false);
      }
    };
    const onAutoNext = (ev: Event) => {
      const customEv = ev as CustomEvent<{ targetId: string }>;
      if (customEv.detail?.targetId === playerId) {
        togglePlay(true);
      }
    };
    window.addEventListener('labtrack-audio-play', onGlobalPlay);
    window.addEventListener('labtrack-audio-autonext', onAutoNext);
    return () => {
      window.removeEventListener('labtrack-audio-play', onGlobalPlay);
      window.removeEventListener('labtrack-audio-autonext', onAutoNext);
      stopSynth();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [playerId]);

  const startWebAudioSynth = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      audioCtxRef.current = ctx;
      const isDugss = previewUrl.includes('dugss') || title.toLowerCase().includes('dugss') || title.toLowerCase().includes('budots');

      if (isDugss) {
        const leadNotes = [329.63, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 261.63];
        let step = 0;
        const playBeat = () => {
          if (!audioCtxRef.current || isMuted) return;
          const now = ctx.currentTime;
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(135, now);
          kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.18);
          kickGain.gain.setValueAtTime(0.32, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.26);

          const leadOsc = ctx.createOscillator();
          const leadGain = ctx.createGain();
          leadOsc.type = 'sawtooth';
          leadOsc.frequency.setValueAtTime(leadNotes[step % leadNotes.length], now + 0.2);
          leadGain.gain.setValueAtTime(0.001, now + 0.2);
          leadGain.gain.exponentialRampToValueAtTime(0.11, now + 0.24);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          leadOsc.connect(leadGain);
          leadGain.connect(ctx.destination);
          leadOsc.start(now + 0.2);
          leadOsc.stop(now + 0.42);

          step++;
          setProgress((prev) => (prev >= 30 ? 0 : prev + 0.43));
        };
        playBeat();
        synthTimerRef.current = window.setInterval(playBeat, 430);
        setIsPlaying(true);
        return;
      }

      const chords = [
        [261.63, 329.63, 392.0, 493.88],
        [220.0, 261.63, 329.63, 392.0],
        [174.61, 220.0, 261.63, 349.23],
        [196.0, 246.94, 293.66, 392.0],
      ];
      let step = 0;
      const playChord = () => {
        if (!audioCtxRef.current || isMuted) return;
        const now = ctx.currentTime;
        chords[step % chords.length].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.45);
        });
        step++;
        setProgress((prev) => (prev >= 30 ? 0 : prev + 1.5));
      };
      playChord();
      synthTimerRef.current = window.setInterval(playChord, 1500);
      setIsPlaying(true);
    } catch {}
  };

  const togglePlay = async (forceStart = false) => {
    if (isPlaying && !forceStart) {
      if (audioRef.current) audioRef.current.pause();
      stopSynth();
      setIsPlaying(false);
      return;
    }

    window.dispatchEvent(new CustomEvent('labtrack-audio-play', { detail: { id: playerId } }));

    if (usingSynth || !previewUrl.startsWith('http')) {
      setUsingSynth(true);
      startWebAudioSynth();
      return;
    }

    const el = audioRef.current;
    if (!el) return;
    try {
      el.volume = isMuted ? 0 : 0.95;
      await el.play();
      setIsPlaying(true);
    } catch {
      setUsingSynth(true);
      startWebAudioSynth();
    }
  };

  const formatSec = (s: number) => {
    const sec = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(sec / 60)}:${sec % 60 < 10 ? '0' : ''}${sec % 60}`;
  };

  return (
    <div className="my-2 p-3 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-xl space-y-2 text-white">
      {previewUrl.startsWith('http') && (
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="metadata"
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration && isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
          }}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
            if (nextPlayerId) {
              window.dispatchEvent(new CustomEvent('labtrack-audio-autonext', { detail: { targetId: nextPlayerId } }));
            }
          }}
          onError={() => setUsingSynth(true)}
        />
      )}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/40 shrink-0 bg-slate-900">
          <img
            src={artworkUrl}
            alt={title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/lab-background.jpg';
            }}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => togglePlay(false)}
            className="absolute inset-0 bg-slate-950/55 hover:bg-cyan-600/75 flex items-center justify-center transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
              <Music className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span className="truncate">{title}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (audioRef.current) audioRef.current.muted = next;
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer shrink-0"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
          <p className="text-[10.5px] text-cyan-300 truncate">{artist}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => togglePlay(false)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition ${
                isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              }`}
            >
              {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
            </button>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                style={{ width: `${Math.min(100, (progress / (duration || 30)) * 100)}%` }}
              />
            </div>
            <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
              {formatSec(progress)} / {formatSec(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AiRichMessageRenderer: React.FC<AiRichMessageRendererProps> = ({ text, className = '' }) => {
  const [previewImg, setPreviewImg] = useState<{ src: string; alt: string } | null>(null);
  const instancePrefix = useRef(`msg-${Math.random().toString(36).slice(2, 8)}`).current;

  if (!text) return null;

  const tokenRegex =
    /!\[([^\]]*)\]\(([^)]+)\)|\[SYSTEM_PAGE_PIC:([^|\]]*)\|([^|\]]*)\|([^|\]]*)\|([^|\]]*)\|([^\]]*)\]|\[AUDIO:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]*)\]|\[VIDEO:([^|\]]+)\|([^|\]]+)\|([^\]]*)\]|\[PDF:([^|\]]+)\|([^\]]*)\]|\[YOUTUBE:([^|\]]+)\|([^\]]+)\]/g;
  const segments: RichSegment[] = [];
  let lastIndex = 0;
  let audioCounter = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      segments.push({ type: 'image', alt: match[1] || 'LabTrack Visual', src: match[2].trim() });
    } else if (match[3] !== undefined) {
      segments.push({
        type: 'system_page_pic',
        route: (match[3] || '/').trim(),
        pageTitle: (match[4] || 'LabTrack System Page').trim(),
        role: (match[5] || 'STUDENT').trim(),
        wsCode: (match[6] || 'WS-02').trim(),
        labName: (match[7] || 'Main Lab').trim(),
      });
    } else if (match[10] !== undefined) {
      segments.push({
        type: 'audio',
        title: match[8].trim(),
        artist: match[9].trim(),
        previewUrl: match[10].trim(),
        artworkUrl: (match[11] || '/assets/images/lab-background.jpg').trim(),
        trackIndex: audioCounter++,
      });
    } else if (match[13] !== undefined) {
      segments.push({
        type: 'video',
        title: match[12].trim(),
        videoUrl: match[13].trim(),
        posterUrl: (match[14] || '/assets/images/lab-background.jpg').trim(),
      });
    } else if (match[15] !== undefined) {
      segments.push({
        type: 'pdf',
        title: match[15].trim(),
        subtitle: (match[16] || 'Official PDF Export').trim(),
      });
    } else if (match[17] !== undefined) {
      segments.push({
        type: 'youtube',
        query: match[17].trim(),
        label: match[18].trim(),
      });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  const totalAudioTracks = audioCounter;

  const formatInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950/40 font-mono text-[10.5px] text-cyan-300 border border-slate-700/50">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const renderTextBlock = (raw: string, idx: number) => {
    if (!raw.trim()) return null;
    const blocks = raw.split(/(```[\s\S]*?```)/g);
    return (
      <div key={idx} className="space-y-1.5">
        {blocks.map((b, bIdx) => {
          if (b.startsWith('```') && b.endsWith('```')) {
            const lines = b.slice(3, -3).trim().split('\n');
            const firstLine = lines[0]?.trim() || '';
            const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
            const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
            return (
              <pre key={bIdx} className="my-2 p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                <code>{codeContent}</code>
              </pre>
            );
          }
          return (
            <div key={bIdx} className="space-y-1 whitespace-pre-wrap leading-relaxed">
              {b.split('\n').map((line, lIdx) => (
                <div key={lIdx}>{formatInline(line)}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'system_page_pic') {
          return (
            <LiveSystemPageScreenshotCard
              key={idx}
              route={seg.route}
              pageTitle={seg.pageTitle}
              role={seg.role}
              wsCode={seg.wsCode}
              labName={seg.labName}
              onPreview={(src, alt) => setPreviewImg({ src, alt })}
            />
          );
        }

        if (seg.type === 'image') {
          return (
            <div key={idx} className="my-2 rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/90 shadow-lg group relative">
              <div className="relative min-h-[130px] bg-slate-900 flex items-center justify-center">
                <img
                  src={seg.src}
                  alt={seg.alt}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onClick={() => setPreviewImg({ src: seg.src, alt: seg.alt })}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.retried) {
                      target.dataset.retried = '1';
                      target.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(seg.alt || 'high resolution photo')}?width=800&height=480&nologo=true`;
                    } else if (!target.src.includes('/assets/images/lab-background.jpg')) {
                      target.src = '/assets/images/lab-background.jpg';
                    }
                  }}
                  className="w-full max-h-64 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => setPreviewImg({ src: seg.src, alt: seg.alt })}
                    className="p-1.5 rounded-lg bg-slate-950/80 text-white hover:bg-cyan-600 transition cursor-pointer shadow"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <a href={seg.src} target="_blank" rel="noreferrer" download className="p-1.5 rounded-lg bg-slate-950/80 text-white hover:bg-blue-600 transition cursor-pointer shadow">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-bold truncate flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                  {seg.alt}
                </span>
                <a href={seg.src} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-semibold">
                  <span>HD</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        }

        if (seg.type === 'audio') {
          const currentId = `${instancePrefix}-track-${seg.trackIndex}`;
          const nextId = seg.trackIndex + 1 < totalAudioTracks ? `${instancePrefix}-track-${seg.trackIndex + 1}` : undefined;
          return (
            <InteractiveAudioPlayerCard
              key={idx}
              title={seg.title}
              artist={seg.artist}
              previewUrl={seg.previewUrl}
              artworkUrl={seg.artworkUrl}
              playerId={currentId}
              nextPlayerId={nextId}
            />
          );
        }

        if (seg.type === 'video') {
          return (
            <div key={idx} className="my-2 rounded-2xl overflow-hidden border border-indigo-500/40 bg-slate-950 shadow-xl text-white">
              <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-extrabold">
                <span className="flex items-center gap-1.5 truncate text-cyan-300">
                  <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {seg.title}
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-600/40 text-indigo-200">Video Stream</span>
              </div>
              <video
                controls
                preload="metadata"
                poster={seg.posterUrl}
                src={seg.videoUrl}
                className="w-full max-h-60 bg-black object-contain"
              />
            </div>
          );
        }

        if (seg.type === 'pdf') {
          return (
            <div key={idx} className="my-2 p-3 rounded-2xl bg-slate-950/95 border border-emerald-500/40 shadow-lg flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white truncate">{seg.title}.pdf</p>
                  <p className="text-[10px] text-emerald-300 truncate">{seg.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadRealPdfFile(seg.title, text)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer shadow transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          );
        }

        if (seg.type === 'youtube') {
          const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(seg.query)}`;
          return (
            <a
              key={idx}
              href={ytUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-extrabold text-[10.5px] shadow transition mt-1"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{seg.label}</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          );
        }

        return renderTextBlock(seg.content, idx);
      })}

      {previewImg && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-extrabold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                {previewImg.alt}
              </span>
              <button type="button" onClick={() => setPreviewImg(null)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950 max-h-[80vh] overflow-auto">
              <img src={previewImg.src} alt={previewImg.alt} className="max-h-[72vh] w-auto rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiRichMessageRenderer;


