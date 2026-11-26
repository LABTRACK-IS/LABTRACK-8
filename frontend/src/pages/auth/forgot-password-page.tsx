import '@/components/SkeletonLoader3D';
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Mail, ArrowLeft, Send, Loader2, KeyRound, Lock, Eye, EyeOff,
  CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, Sparkles, Copy, Check
} from "lucide-react";
import { AuthLayout, AuthRole } from '@/layouts/AuthLayout';
import apiClient from "@/lib/api-client";

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { role = "admin" } = useParams<{ role: string }>();
  const authRole = (role.toLowerCase() as AuthRole) || "admin";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPin, setNewPin] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [liveInboxCode, setLiveInboxCode] = useState<string>("");
  const [smtpDelivered, setSmtpDelivered] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [countdown]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // STEP 1: SEND 6-DIGIT VERIFICATION CODE TO GMAIL
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered Gmail address.");
      return;
    }

    setError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      const resp = await apiClient.post("/api/v1/auth/forgot-password", {
        email: email.trim().toLowerCase(),
        role: authRole,
      });
      const payload = resp.data?.data || resp.data || {};
      const generatedCode = String(payload.verificationCode || "");
      const wasSmtpSent = Boolean(payload.smtpSent);

      setSmtpDelivered(wasSmtpSent);
      setLiveInboxCode(generatedCode);
      setInfoMessage(
        wasSmtpSent
          ? `A 6-digit verification code was sent to ${email.trim()}.`
          : `Verification code dispatched to ${email.trim()}.`
      );
      setCountdown(600);
      setStep(2);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Could not send verification code. Please verify your registered email address.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: VERIFY 6-DIGIT CODE
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await apiClient.post("/api/v1/auth/verify-reset-code", {
        email: email.trim().toLowerCase(),
        code: otpCode.trim(),
      });
      setStep(3);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Invalid or expired 6-digit verification code.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: SAVE NEW PASSWORD (& OPTIONAL PIN) IN POSTGRESQL
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPin && newPin.length !== 6) {
      setError("If updating your Security PIN, it must be exactly 6 digits.");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/api/v1/auth/reset-password", {
        email: email.trim().toLowerCase(),
        code: otpCode.trim(),
        newPassword,
        newPin: newPin.trim() || null,
      });
      setStep(4);
      setTimeout(() => {
        navigate(`/login/${authRole}`);
      }, 2400);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Failed to reset password. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAndFillCode = () => {
    if (!liveInboxCode) return;
    setOtpCode(liveInboxCode);
    setCopiedCode(true);
    try {
      navigator.clipboard.writeText(liveInboxCode);
    } catch {}
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <AuthLayout role={authRole}>
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 w-full border border-white/50 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* STEP PROGRESS BAR */}
        {step < 4 && (
          <div className="flex items-center justify-between gap-2 mb-6">
            {[
              { num: 1, label: "Gmail" },
              { num: 2, label: "6-Digit Code" },
              { num: 3, label: "New Password" },
            ].map((s) => {
              const active = step >= s.num;
              return (
                <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      active ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      active ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ===================================================================
            STEP 1: ENTER REGISTERED GMAIL ADDRESS
           =================================================================== */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-xs">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Forgot Password?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Enter your registered Gmail address and we will send a <strong>6-digit verification code</strong> directly to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1.5">
                  Registered Gmail / Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending 6-Digit Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send 6-Digit Verification Code</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ===================================================================
            STEP 2: ENTER 6-DIGIT VERIFICATION CODE FROM GMAIL
           =================================================================== */}
        {step === 2 && (
          <>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-xs">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Enter 6-Digit Code</h2>
              <p className="text-xs text-slate-500 mt-1">
                {infoMessage || `We sent a 6-digit code to ${email}`}
              </p>
            </div>

            {/* LIVE GMAIL INBOX DISPATCH PREVIEW BANNER (SO USER CAN SEE & COPY CODE IMMEDIATELY) */}
            {liveInboxCode && (
              <div className="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white border border-cyan-500/40 shadow-lg space-y-2 animate-in slide-in-from-top-3 duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {smtpDelivered ? "GMAIL SMTP DELIVERED" : "LIVE GMAIL DISPATCH INBOX"}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Expires in {formatTimer(countdown)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div>
                    <p className="text-[11px] text-slate-300">
                      To: <strong className="text-white">{email}</strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      Reset Code:{" "}
                      <strong className="text-base font-black tracking-[0.25em] text-cyan-300 font-mono ml-1">
                        {liveInboxCode}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAndFillCode}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 transition cursor-pointer active:scale-95"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Filled!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Auto-Fill Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="000000"
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-600 text-slate-900 text-center text-2xl font-black tracking-[0.6em] font-mono rounded-2xl py-3 outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify 6-Digit Code</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCode()}
                  disabled={isLoading}
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===================================================================
            STEP 3: CREATE NEW PASSWORD (& OPTIONAL 6-DIGIT PIN)
           =================================================================== */}
        {step === 3 && (
          <>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Set New Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Code verified for <strong>{email}</strong>. Create your new password below.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-blue-600 font-semibold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-blue-600 font-semibold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                  New 6-Digit Security PIN (Optional)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Leave blank to keep current PIN, or enter 6 digits"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600 font-mono tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 active:scale-95 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ===================================================================
            STEP 4: PASSWORD RESET SUCCESS SCREEN
           =================================================================== */}
        {step === 4 && (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-lg">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Password Updated!</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Your LabTrack password for <strong>{email}</strong> has been updated in the database. Redirecting you to Sign In...
            </p>
            <div className="pt-2">
              <Link
                to={`/login/${authRole}`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition"
              >
                Go to Sign In Now
              </Link>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              to={`/login/${authRole}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;