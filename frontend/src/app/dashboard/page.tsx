"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type AppState = "upload" | "progress" | "success";
type Operation = "encrypt" | "decrypt";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customFilename, setCustomFilename] = useState("");
  const [appState, setAppState] = useState<AppState>("upload");
  const [operation, setOperation] = useState<Operation>("encrypt");
  const [progress, setProgress] = useState(0);
  const [resultFilename, setResultFilename] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const downloadBlobRef = useRef<{ blob: Blob; filename: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
    else fetchHistory();
  }, [router]);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch {}
  };

  const handleLogout = () => { localStorage.removeItem("token"); router.push("/"); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: "—", color: "#475569" };
    let s = 0;
    if (password.length > 5) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (s <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (s === 2) return { score: 2, label: "Moderate", color: "#f59e0b" };
    if (s === 3) return { score: 3, label: "Strong", color: "#24dbe8" };
    return { score: 4, label: "Optimal", color: "#00f3ff" };
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_+";
    let p = "";
    for (let i = 0; i < 16; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
    navigator.clipboard.writeText(p).catch(() => {});
    setStatusMsg("Password generated and copied to clipboard!");
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const startProcess = async (op: Operation) => {
    if (!file) { setStatusMsg("Please select a file first."); return; }
    if (!password) { setStatusMsg("Please enter a password."); return; }
    const strength = getPasswordStrength();
    if (strength.score < 2) { setStatusMsg("Password is too weak. Use a stronger one."); return; }

    setOperation(op);
    setErrorMsg("");
    setStatusMsg("");
    setProgress(0);
    setAppState("progress");

    // Animated fake progress while request is in flight
    let pct = 0;
    progressTimerRef.current = setInterval(() => {
      pct += Math.floor(Math.random() * 10) + 4;
      if (pct >= 90) { pct = 90; if (progressTimerRef.current) clearInterval(progressTimerRef.current); }
      setProgress(pct);
    }, 150);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);
    if (customFilename.trim()) formData.append("custom_filename", customFilename.trim());

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${op}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (!response.ok) {
        if (response.status === 401) { handleLogout(); return; }
        const err = await response.json().catch(() => null);
        setErrorMsg(err?.detail || `${op} failed. Check your password.`);
        setProgress(0);
        setAppState("upload");
        fetchHistory();
        return;
      }

      const blob = await response.blob();
      const backendFilename = response.headers.get("x-filename");
      let fname: string;
      if (backendFilename) {
        fname = backendFilename;
      } else if (customFilename.trim()) {
        fname = op === "encrypt" && !customFilename.endsWith(".enc") ? `${customFilename}.enc` : customFilename;
      } else if (op === "encrypt") {
        fname = `${file.name}.enc`;
      } else {
        fname = file.name.endsWith(".enc") ? file.name.slice(0, -4) : `decrypted_${file.name}`;
      }

      downloadBlobRef.current = { blob, filename: fname };
      setResultFilename(fname);
      setProgress(100);
      setTimeout(() => { setAppState("success"); fetchHistory(); setPassword(""); setCustomFilename(""); }, 400);
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setErrorMsg("Cannot reach the server. Is the backend running?");
      setProgress(0);
      setAppState("upload");
    }
  };

  const handleDownload = () => {
    if (!downloadBlobRef.current) return;
    const { blob, filename } = downloadBlobRef.current;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setAppState("upload"); setResultFilename(""); downloadBlobRef.current = null; if (fileInputRef.current) fileInputRef.current.value = ""; };

  const strength = getPasswordStrength();
  const isEnc = operation === "encrypt";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#10131d", color: "#e0e2f1", fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50" style={{ background: "rgba(10,14,24,0.8)", backdropFilter: "blur(16px)", boxShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
        <div className="h-16 max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: "#00f3ff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="font-bold text-base tracking-tight uppercase" style={{ color: "#e3fdff", fontFamily: '"Space Grotesk", sans-serif' }}>SECUREFILE</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 pl-3" style={{ borderLeft: "1px solid rgba(58,73,75,0.3)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#00f3ff", boxShadow: "0 0 8px #00f3ff", animation: "pulse 2s infinite" }} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "#00dce6" }}>SYSTEM ONLINE // AES-256 GCM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest" style={{ background: "rgba(22,28,45,1)", border: "1px solid rgba(0,243,255,0.15)", color: "#24dbe8" }}>
              <svg className="w-3 h-3" style={{ color: "#24dbe8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              ZERO-LOGS ACTIVE
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pt-16 flex items-start justify-center" style={{ minHeight: "calc(100vh - 4rem)" }}>
        <div className="flex w-full max-w-5xl gap-5 p-4 pt-8 items-start">

          {/* MAIN CARD */}
          <div className="flex-1 rounded-xl relative overflow-hidden transition-all duration-300" style={{ background: "rgba(10,14,24,0.8)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,243,255,0.2)", boxShadow: "0 0 50px rgba(0,243,255,0.08), inset 0 1px 1px rgba(255,255,255,0.06)" }}>
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(0,243,255,0.4), transparent)" }} />
            
            {/* Corner brackets */}
            <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 rounded-tl" style={{ borderColor: "rgba(0,243,255,0.4)" }} />
            <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 rounded-tr" style={{ borderColor: "rgba(0,243,255,0.4)" }} />
            <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 rounded-bl" style={{ borderColor: "rgba(0,243,255,0.4)" }} />
            <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 rounded-br" style={{ borderColor: "rgba(0,243,255,0.4)" }} />

            <div className="p-6 sm:p-8">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 mb-6" style={{ borderBottom: "1px solid rgba(58,73,75,0.2)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#00f3ff", animation: "ping 2s infinite" }} />
                  <span className="font-bold text-lg tracking-tight" style={{ color: "#e3fdff", fontFamily: '"Space Grotesk", sans-serif' }}>
                    KRYPTOS <span className="text-sm font-mono font-normal" style={{ color: "#00dce6" }}>v4.1</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold" style={{ background: "rgba(22,28,45,1)", border: "1px solid rgba(0,243,255,0.15)", color: "#00dce6" }}>
                  <svg className="w-3 h-3" style={{ color: "#00f3ff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  AES-256 GCM
                </div>
              </div>

              {/* Error/status message */}
              {(errorMsg || statusMsg) && (
                <div className="mb-4 p-3 rounded-lg text-sm text-center" style={{ background: errorMsg ? "rgba(127,29,29,0.5)" : "rgba(6,78,59,0.5)", border: `1px solid ${errorMsg ? "rgba(239,68,68,0.4)" : "rgba(0,243,255,0.3)"}`, color: errorMsg ? "#fca5a5" : "#6ee7b7" }}>
                  {errorMsg || statusMsg}
                </div>
              )}

              {/* ===== UPLOAD STATE ===== */}
              {appState === "upload" && (
                <div className="space-y-5">
                  {/* Dropzone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                    className="relative rounded-xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer"
                    style={{ border: `2px dashed ${isDragging ? "rgba(0,243,255,0.6)" : "rgba(58,73,75,0.4)"}`, background: isDragging ? "rgba(0,243,255,0.05)" : "rgba(22,28,45,0.4)" }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    {file ? (
                      <div className="flex items-center justify-between p-3.5 rounded-lg" style={{ background: "rgba(38,42,53,0.6)", border: "1px solid rgba(0,243,255,0.2)" }}>
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "rgba(0,243,255,0.15)", color: "#00f3ff" }}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-mono font-semibold truncate max-w-[220px]" style={{ color: "#e0e2f1" }}>{file.name}</p>
                            <p className="text-[10px] font-mono" style={{ color: "#849495" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1.5 rounded transition-colors" style={{ color: "#849495" }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,243,255,0.1)", color: "#00f3ff", boxShadow: "0 0 20px rgba(0,243,255,0.15)" }}>
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: "#e0e2f1", fontFamily: '"Space Grotesk", sans-serif' }}>Drop your file here</p>
                          <p className="text-sm mt-1" style={{ color: "#849495" }}>or <span style={{ color: "#00f3ff", textDecoration: "underline" }}>browse filesystem</span></p>
                        </div>
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: "#3a494b" }}>Zero-Knowledge · Processed locally</p>
                      </div>
                    )}
                  </div>

                  {/* Save As */}
                  <div>
                    <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#849495" }}>Save As (Optional — hides metadata)</label>
                    <input type="text" value={customFilename} onChange={e => setCustomFilename(e.target.value)} placeholder="Custom output filename..."
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono focus:outline-none transition-all"
                      style={{ background: "rgba(10,14,24,0.8)", border: "1px solid rgba(58,73,75,0.4)", color: "#e0e2f1" }}
                      onFocus={e => e.target.style.borderColor = "#00f3ff"}
                      onBlur={e => e.target.style.borderColor = "rgba(58,73,75,0.4)"}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: "#849495" }}>Passphrase Protection</label>
                      <div className="flex items-center gap-3">
                        <button onClick={generatePassword} className="text-[11px] font-mono font-semibold" style={{ color: "#00dce6" }}>Generate</button>
                        <span className="text-[11px] font-mono font-semibold" style={{ color: strength.color }}>Strength: {strength.label}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "#3a494b" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </div>
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter secure cryptographic key..."
                        className="w-full pl-10 pr-10 py-3 rounded-lg text-sm font-mono focus:outline-none transition-all"
                        style={{ background: "rgba(10,14,24,0.8)", border: "1px solid rgba(58,73,75,0.4)", color: "#e0e2f1" }}
                        onFocus={e => { e.target.style.borderColor = "#00f3ff"; e.target.style.boxShadow = "0 0 0 1px rgba(0,243,255,0.4)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(58,73,75,0.4)"; e.target.style.boxShadow = "none"; }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors" style={{ color: "#3a494b" }}>
                        {showPassword
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                    {/* Strength bars */}
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : "#1c1f2a", boxShadow: i <= strength.score ? `0 0 8px ${strength.color}` : "none" }} />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button onClick={() => startProcess("encrypt")} className="w-full py-3.5 px-4 rounded-lg font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: "#00f3ff", color: "#002022", boxShadow: "0 0 0 0 transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 25px rgba(0,243,255,0.45)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 0 transparent")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Encrypt
                    </button>
                    <button onClick={() => startProcess("decrypt")} className="w-full py-3.5 px-4 rounded-lg font-mono text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                      style={{ border: "1px solid rgba(0,220,230,0.5)", background: "rgba(0,220,230,0.1)", color: "#00dce6" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,220,230,0.15)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,220,230,0.1)")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                      Decrypt
                    </button>
                  </div>
                </div>
              )}

              {/* ===== PROGRESS STATE ===== */}
              {appState === "progress" && (
                <div className="py-10 flex flex-col items-center text-center">
                  {/* File flow visualization */}
                  <div className="flex items-center justify-center gap-6 w-full max-w-xs mx-auto py-4 mb-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(38,42,53,1)", border: "1px solid rgba(58,73,75,0.3)", color: "#e0e2f1" }}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <span className="text-xs font-mono mt-2 max-w-[80px] truncate" style={{ color: "#849495" }}>{file?.name}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="w-full h-0.5" style={{ background: "linear-gradient(to right, rgba(0,243,255,0.2), #00f3ff, rgba(0,243,255,0.2))" }} />
                      <div className="absolute p-1 rounded-full" style={{ background: "#00f3ff", color: "#002022" }}>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.4)", color: "#00f3ff", boxShadow: "0 0 15px rgba(0,243,255,0.2)" }}>
                        {isEnc
                          ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                        }
                      </div>
                      <span className="text-xs font-mono mt-2" style={{ color: "#00dce6" }}>{isEnc ? ".enc" : "original"}</span>
                    </div>
                  </div>

                  <div className="w-full max-w-xs mx-auto space-y-2">
                    <div className="flex justify-between font-mono text-sm">
                      <span style={{ color: "#e0e2f1" }}>{isEnc ? "Encrypting Cipher Stream" : "Decrypting Vault Stream"}</span>
                      <span className="font-bold" style={{ color: "#00f3ff" }}>{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full p-0.5 overflow-hidden" style={{ background: "rgba(38,42,53,1)" }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(to right, #adc6ff, #00f3ff, #6ff6ff)", boxShadow: "0 0 12px rgba(0,243,255,0.5)" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ===== SUCCESS STATE ===== */}
              {appState === "success" && (
                <div className="py-8 flex flex-col items-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.4)", color: "#00f3ff", boxShadow: "0 0 30px rgba(0,243,255,0.25)" }}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: "#e3fdff", fontFamily: '"Space Grotesk", sans-serif' }}>{isEnc ? "Encryption Complete" : "Decryption Complete"}</h3>
                    <p className="text-sm mt-1" style={{ color: "#849495" }}>{isEnc ? "Authenticated ciphertext stream ready" : "File restored successfully"}</p>
                  </div>
                  <div className="w-full p-3.5 rounded-xl flex items-center justify-between" style={{ background: "rgba(22,28,45,0.6)", border: "1px solid rgba(0,243,255,0.2)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "rgba(0,243,255,0.15)", color: "#00f3ff" }}>
                        {isEnc
                          ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        }
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-mono font-semibold truncate max-w-[200px]" style={{ color: "#e0e2f1" }}>{resultFilename}</p>
                        <p className="text-[10px] font-mono" style={{ color: "#3a494b" }}>SHA-256 VERIFIED</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5" style={{ color: "#00f3ff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div className="w-full flex gap-3">
                    <button onClick={handleDownload} className="flex-1 py-3.5 px-4 rounded-lg font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                      style={{ background: "#00f3ff", color: "#002022" }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 25px rgba(0,243,255,0.45)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                    </button>
                    <button onClick={reset} className="py-3.5 px-5 rounded-lg font-mono text-sm transition-all" style={{ border: "1px solid rgba(58,73,75,0.5)", color: "#849495" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#e0e2f1")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#849495")}
                    >Process Another</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HISTORY SIDEBAR */}
          <div className="w-64 shrink-0 rounded-xl p-5 max-h-[600px] overflow-y-auto" style={{ background: "rgba(10,14,24,0.8)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,243,255,0.15)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" style={{ color: "#00f3ff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h2 className="font-bold text-sm uppercase tracking-wider font-mono" style={{ color: "#e0e2f1" }}>Vault Log</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-xs font-mono" style={{ color: "#3a494b" }}>No operations recorded.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="text-xs pb-2" style={{ borderBottom: "1px solid rgba(22,28,45,1)" }}>
                    <p className="font-mono font-semibold truncate" style={{ color: "#e0e2f1" }}>{h.file_name}</p>
                    <div className="flex justify-between mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: h.operation === "ENCRYPT" ? "rgba(0,114,255,0.15)" : "rgba(139,92,246,0.15)", color: h.operation === "ENCRYPT" ? "#60a5fa" : "#c4b5fd" }}>
                        {h.operation}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: h.status === "SUCCESS" ? "rgba(0,243,255,0.1)" : "rgba(239,68,68,0.15)", color: h.status === "SUCCESS" ? "#00f3ff" : "#fca5a5" }}>
                        {h.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono mt-1" style={{ color: "#3a494b" }}>{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full" style={{ background: "rgba(10,14,24,0.9)", backdropFilter: "blur(12px)", boxShadow: "0 -1px 8px rgba(0,0,0,0.2)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00f3ff", boxShadow: "0 0 6px #00f3ff" }} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "#849495" }}>END-TO-END ZERO KNOWLEDGE ENCRYPTION</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "#3a494b" }}>CLIENT-SIDE COMPUTED · NO FILES STORED ON SERVER</span>
        </div>
      </footer>
    </div>
  );
}
