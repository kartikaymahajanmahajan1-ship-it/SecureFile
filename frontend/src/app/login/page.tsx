"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("Please check your email and password and try again.");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  // Ambient background particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0, height = 0;
    let animId: number;
    const hexChars = "0123456789ABCDEF";

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; char: string; isChar: boolean };
    type Packet = { x: number; y: number; speed: number; length: number; color: string };

    const particles: Particle[] = [];
    const streams: Packet[] = [];

    const newParticle = (): Particle => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 1.8 + 0.6, alpha: Math.random() * 0.4 + 0.1,
      char: Math.random() > 0.5 ? (Math.random() > 0.5 ? "1" : "0") : hexChars[Math.floor(Math.random() * hexChars.length)],
      isChar: Math.random() > 0.6,
    });
    const newPacket = (): Packet => {
      const fromLeft = Math.random() < 0.5;
      return { x: fromLeft ? 0 : width, y: Math.random() * height, speed: (Math.random() * 2 + 1.2) * (fromLeft ? 1 : -1), length: Math.random() * 40 + 20, color: Math.random() > 0.4 ? "#00f0ff" : "#8b5cf6" };
    };

    for (let i = 0; i < 48; i++) particles.push(newParticle());
    for (let i = 0; i < 14; i++) streams.push(newPacket());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) { Object.assign(p, newParticle()); }
        ctx.save();
        if (p.isChar) { ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillStyle = `rgba(0,240,255,${p.alpha * 0.6})`; ctx.fillText(p.char, p.x, p.y); }
        else { ctx.fillStyle = `rgba(0,163,255,${p.alpha * 0.5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      for (const s of streams) {
        s.x += s.speed;
        if (s.x < -100 || s.x > width + 100) { Object.assign(s, newPacket()); }
        ctx.save(); ctx.strokeStyle = s.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.22;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.speed * 8, s.y); ctx.stroke(); ctx.restore();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/login`, { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        setErrorMsg(err?.detail || "Incorrect email or password.");
        setState("error");
        return;
      }
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      setState("success");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      setErrorMsg("Cannot reach the server. Is the backend running?");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col justify-between selection:text-black"
      style={{ background: "#07090e", color: "#f1f5f9", fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundSize: "50px 50px", backgroundImage: "linear-gradient(to right, rgba(0,240,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.035) 1px, transparent 1px)" }} />
      <div className="fixed top-1/4 left-10 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "rgba(6,182,212,0.08)", filter: "blur(130px)" }} />
      <div className="fixed bottom-1/4 right-10 w-[550px] h-[550px] rounded-full pointer-events-none" style={{ background: "rgba(0,114,255,0.08)", filter: "blur(150px)" }} />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />

      {/* Big background lock icon */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 2, opacity: 0.2 }}>
        <div className="relative w-[780px] h-[780px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-dashed" style={{ borderColor: "rgba(0,240,255,0.2)", animation: "spin 90s linear infinite" }} />
          <div className="absolute inset-8 rounded-full border" style={{ borderColor: "rgba(0,114,255,0.2)", animation: "spin 65s linear reverse infinite" }} />
          <svg className="w-96 h-96" viewBox="0 0 24 24" fill="none" stroke="rgba(0,240,255,0.35)" strokeWidth="0.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="absolute font-mono text-[9px] top-12" style={{ color: "rgba(103,232,249,0.4)", letterSpacing: "0.25em" }}>CIPHER: AES-256-GCM // AUTH_TAG_128</div>
          <div className="absolute font-mono text-[9px] bottom-12" style={{ color: "rgba(167,139,250,0.4)", letterSpacing: "0.25em" }}>ZERO_KNOWLEDGE_VAULT // PBKDF2_HMAC_SHA256</div>
        </div>
      </div>

      {/* Header */}
      <header className="relative w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between" style={{ zIndex: 20 }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.2), rgba(0,114,255,0.3))", border: "1px solid rgba(0,240,255,0.3)", boxShadow: "0 0 20px rgba(0,240,255,0.3)" }}>
            <svg className="w-5 h-5" style={{ color: "#00f0ff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">SecureFile</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold" style={{ background: "rgba(6,182,212,0.1)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.3)" }}>VAULT v2.0</span>
            </div>
            <p className="text-[11px] font-mono hidden sm:block" style={{ color: "#94a3b8" }}>Cybersecurity Lab · Client-Side AES-256-GCM</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono" style={{ background: "rgba(12,16,23,0.8)", border: "1px solid #1e293b", color: "#cbd5e1" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
          <span>VAULT NODE: ONLINE</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ color: "#67e8f9" }}>AES-256 / E2EE</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-8" style={{ zIndex: 20 }}>
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl p-7 sm:p-9 relative overflow-hidden" style={{ background: "rgba(14,20,30,0.78)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,240,255,0.18)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.75), 0 0 40px -10px rgba(0,240,255,0.12), inset 0 1px 0 0 rgba(255,255,255,0.07)" }}>
            {/* Top glow line */}
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #00f0ff, transparent)", opacity: 0.7 }} />
            <div className="absolute pointer-events-none" style={{ top: "-100px", left: "50%", transform: "translateX(-50%)", width: "288px", height: "128px", background: "rgba(0,240,255,0.2)", filter: "blur(50px)" }} />

            {/* Card Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-3.5 relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.2), rgba(0,114,255,0.3))", border: "1px solid rgba(0,240,255,0.3)", boxShadow: "0 0 25px rgba(0,240,255,0.25)" }}>
                  <svg className="w-7 h-7" style={{ color: "#00f0ff", filter: "drop-shadow(0 0 8px rgba(0,240,255,0.5))" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 3.5v6.5c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5.5L12 2z" />
                    <rect x="9.5" y="11" width="5" height="4" rx="1" fill="rgba(0,240,255,0.25)" stroke="#00f0ff" strokeWidth={1.4} />
                    <path d="M10.5 11V9.5a1.5 1.5 0 013 0V11" stroke="#00f0ff" strokeWidth={1.4} strokeLinecap="round" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: "#00f0ff", border: "2px solid #07090e" }} />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">SecureFile</h1>
              <p className="text-xs font-mono mb-3" style={{ color: "rgba(0,240,255,0.9)", letterSpacing: "0.1em" }}>Secure your files. Protect your data.</p>
              <div className="pt-3" style={{ borderTop: "1px solid rgba(30,41,59,0.8)" }}>
                <h2 className="text-base font-bold text-slate-100">Welcome Back</h2>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Sign in to continue to SecureFile</p>
              </div>
            </div>

            {/* Error Banner */}
            {state === "error" && (
              <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3" style={{ background: "rgba(127,29,29,0.7)", border: "1px solid rgba(239,68,68,0.4)" }}>
                <div className="p-1 rounded-lg shrink-0 mt-0.5" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "#fecaca" }}>Login failed</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "rgba(252,202,202,0.9)" }}>{errorMsg}</p>
                </div>
                <button onClick={() => setState("idle")} className="ml-auto p-0.5" style={{ color: "#fca5a5" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Success Banner */}
            {state === "success" && (
              <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3" style={{ background: "rgba(6,78,59,0.7)", border: "1px solid rgba(16,185,129,0.4)" }}>
                <div className="p-1 rounded-lg shrink-0 mt-0.5" style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "#d1fae5" }}>Identity Authenticated</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "rgba(209,250,229,0.9)" }}>Session key derived. Redirecting to vault...</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold" style={{ color: "#cbd5e1" }}>Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "#64748b" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
                    style={{ background: "rgba(9,13,20,0.85)", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                    onFocus={e => { e.target.style.borderColor = "#00f0ff"; e.target.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.16), 0 0 20px rgba(0,240,255,0.15)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold" style={{ color: "#cbd5e1" }}>Password</label>
                  <Link href="/register" className="text-[11px] font-mono" style={{ color: "#67e8f9" }}>No account? Register</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "#64748b" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
                    style={{ background: "rgba(9,13,20,0.85)", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                    onFocus={e => { e.target.style.borderColor = "#00f0ff"; e.target.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.16)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors" style={{ color: "#64748b" }}>
                    {showPassword
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button type="submit" disabled={state === "loading" || state === "success"}
                  className="w-full relative overflow-hidden py-3 px-4 rounded-xl font-bold text-sm transition-all"
                  style={{ background: "linear-gradient(to right, #00f0ff, #67e8f9, #0072ff)", color: "#07090e", boxShadow: "0 0 20px rgba(0,240,255,0.4)" }}>
                  {state === "loading"
                    ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      <span>Signing in...</span>
                    </span>
                    : <span className="flex items-center justify-center gap-2 font-bold tracking-wide">
                      <span>Sign In</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  }
                </button>
              </div>
            </form>

            <div className="mt-5 text-center text-xs" style={{ color: "#94a3b8" }}>
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "#67e8f9" }}>Create one</Link>
            </div>

            {/* Bottom security badge */}
            <div className="mt-6 pt-4 flex items-center justify-center gap-2 text-[11px] font-mono" style={{ borderTop: "1px solid rgba(30,41,59,0.8)", color: "#94a3b8" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
              <span>🔒 Your connection is protected</span>
              <span style={{ color: "#334155" }}>•</span>
              <span style={{ color: "rgba(0,240,255,0.9)" }}>AES-256-GCM</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full px-6 py-4 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono" style={{ zIndex: 20, color: "#64748b", borderTop: "1px solid rgba(22,28,45,0.9)" }}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#67e8f9" }} /> SECUREFILE LAB CORE
          </span>
          <span className="hidden md:inline" style={{ color: "#1e293b" }}>|</span>
          <span className="hidden md:inline">NIST SP 800-38D Compliant</span>
        </div>
        <span>FLOW: LOGIN → ENCRYPT / DECRYPT → EXPORT</span>
      </footer>
    </div>
  );
}
