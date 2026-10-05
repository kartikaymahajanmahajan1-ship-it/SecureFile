import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col justify-between selection:text-black"
      style={{ background: "#07090e", color: "#f1f5f9", fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundSize: "50px 50px", backgroundImage: "linear-gradient(to right, rgba(0,240,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.035) 1px, transparent 1px)" }} />
      <div className="fixed top-1/4 left-10 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "rgba(6,182,212,0.08)", filter: "blur(130px)" }} />
      <div className="fixed bottom-1/4 right-10 w-[550px] h-[550px] rounded-full pointer-events-none" style={{ background: "rgba(0,114,255,0.08)", filter: "blur(150px)" }} />

      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-8" style={{ zIndex: 20 }}>
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl p-7 sm:p-9 relative overflow-hidden" style={{ background: "rgba(14,20,30,0.78)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,240,255,0.18)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.75), 0 0 40px -10px rgba(0,240,255,0.12), inset 0 1px 0 0 rgba(255,255,255,0.07)" }}>
            {/* Top glow line */}
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #00f0ff, transparent)", opacity: 0.7 }} />

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-5 relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.2), rgba(0,114,255,0.3))", border: "1px solid rgba(0,240,255,0.3)", boxShadow: "0 0 25px rgba(0,240,255,0.25)" }}>
                  <svg className="w-8 h-8" style={{ color: "#00f0ff", filter: "drop-shadow(0 0 8px rgba(0,240,255,0.5))" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 3.5v6.5c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5.5L12 2z" />
                    <rect x="9.5" y="11" width="5" height="4" rx="1" fill="rgba(0,240,255,0.25)" stroke="#00f0ff" strokeWidth={1.4} />
                    <path d="M10.5 11V9.5a1.5 1.5 0 013 0V11" stroke="#00f0ff" strokeWidth={1.4} strokeLinecap="round" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: "#00f0ff", border: "2px solid #07090e" }} />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">SecureFile</h1>
              <p className="text-sm font-mono" style={{ color: "rgba(0,240,255,0.9)", letterSpacing: "0.1em" }}>Local File Encryption, Secured by You.</p>
            </div>
            
            <div className="space-y-4 pt-4" style={{ borderTop: "1px solid rgba(30,41,59,0.8)" }}>
              <Link href="/login" className="flex items-center justify-center w-full relative overflow-hidden py-3.5 px-4 rounded-xl font-bold text-sm transition-all"
                style={{ background: "linear-gradient(to right, #00f0ff, #67e8f9, #0072ff)", color: "#07090e", boxShadow: "0 0 20px rgba(0,240,255,0.3)" }}>
                Sign In to Vault
              </Link>
              <Link href="/register" className="flex items-center justify-center w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all"
                style={{ background: "rgba(9,13,20,0.85)", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff" }}>
                Create New Identity
              </Link>
            </div>
            
            <div className="mt-8 pt-4 flex items-center justify-center gap-2 text-[11px] font-mono" style={{ borderTop: "1px solid rgba(30,41,59,0.8)", color: "#94a3b8" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
              <span>AES-256-GCM Encryption</span>
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
        <span>FLOW: ROOT → LOGIN → ENCRYPT</span>
      </footer>
    </div>
  );
}
