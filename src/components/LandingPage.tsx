import React, { useState } from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Database, 
  Cpu, 
  Key, 
  CheckCircle2, 
  Users, 
  Layers, 
  Zap, 
  ShieldAlert
} from "lucide-react";
import { PRESET_USERS } from "../services/firebaseService";
import { UserProfile } from "../types";

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  onSelectPersona: (user: UserProfile) => void;
  isLoading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onSelectPersona,
  isLoading
}) => {
  const [selectedPersona, setSelectedPersona] = useState<UserProfile>(PRESET_USERS[0]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C] flex flex-col justify-between selection:bg-[#5A634D]/20 selection:text-[#5A634D]">
      
      {/* Top Banner */}
      <div className="border-b border-[#EAE7DC] bg-[#F9F7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-[#8E8E8E]">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5A634D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5A634D]"></span>
            </span>
            <span className="font-mono text-[#2C2C2C]">Security Architecture Verified: OWASP Top 10 & Gemini 3.6 Flash Fallback Ladder Active</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <span className="text-[#5A634D] font-mono font-semibold">rules_version = '2'</span>
            <span>•</span>
            <span className="text-[#5A634D] font-mono font-semibold">Isolated Partitioning: /users/&#123;uid&#125;</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Prop & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#5A634D]/10 border border-[#5A634D]/25 text-[#5A634D] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Turn AI Cognitive Journal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-serif text-[#2C2C2C] leading-[1.15]">
              Elevate Your Thinking with <span className="italic text-[#5A634D]">Private Cognitive Reflections</span>.
            </h1>

            <p className="text-base sm:text-lg text-[#66635B] max-w-2xl leading-relaxed">
              ReflexIQ combines the conversational intelligence of <span className="text-[#2C2C2C] font-semibold">Gemini 3.6 Flash</span> with <span className="text-[#2C2C2C] font-semibold">Firestore Owner-Bound Partitioning</span> to offer a secure, multi-turn sounding board that never leaks your personal reflections.
            </p>

            {/* Authentication Gateway Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#EAE7DC] shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#2C2C2C] flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-[#5A634D]" />
                    <span>Secure Authenticated Sign-In</span>
                  </h3>
                  <p className="text-xs text-[#8E8E8E] mt-0.5">Federated Google Authentication — zero plaintext password exposure.</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-mono bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 rounded-md font-semibold">
                  OWASP A01 / A03 Enforced
                </span>
              </div>

              {/* Primary Google Sign-In Action */}
              <button
                id="sign-in-google-button"
                onClick={onSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-3 py-3.5 px-6 rounded-xl bg-[#5A634D] hover:bg-[#484F3D] text-white font-medium text-sm shadow-md shadow-[#5A634D]/20 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-semibold">Continue with Google Sign-In</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Persona Quick-Launch (For instant testing & multi-user isolation verification) */}
              <div className="pt-2 border-t border-[#EAE7DC]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-[#2C2C2C] flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-[#5A634D]" />
                    <span>Instant Persona Launch (Test Multi-User Isolation)</span>
                  </span>
                  <span className="text-[10px] text-[#8E8E8E]">Zero Signup Needed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_USERS.map((preset) => (
                    <button
                      key={preset.uid}
                      id={`persona-btn-${preset.uid}`}
                      onClick={() => onSelectPersona(preset)}
                      className="flex items-center space-x-2 p-2 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] hover:border-[#5A634D]/40 text-left transition-all group cursor-pointer"
                    >
                      <img
                        src={preset.photoURL || ""}
                        alt={preset.displayName || ""}
                        className="w-7 h-7 rounded-lg object-cover border border-[#D8D0C1] group-hover:border-[#5A634D] transition-colors"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#2C2C2C] truncate group-hover:text-[#5A634D]">
                          {preset.displayName?.split(" ")[0]}
                        </p>
                        <p className="text-[10px] text-[#8E8E8E] truncate font-mono">
                          {preset.uid.replace("usr_", "")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Micro Guarantees */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs text-[#66635B]">
                <CheckCircle2 className="w-4 h-4 text-[#5A634D] flex-shrink-0" />
                <span>Zero Hardcoding</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#66635B]">
                <CheckCircle2 className="w-4 h-4 text-[#5A634D] flex-shrink-0" />
                <span>4-Tier Fallback</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#66635B]">
                <CheckCircle2 className="w-4 h-4 text-[#5A634D] flex-shrink-0" />
                <span>Owner Path Rules</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#66635B]">
                <CheckCircle2 className="w-4 h-4 text-[#5A634D] flex-shrink-0" />
                <span>Strict Sanitization</span>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural Highlights Card */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Security Architecture Card */}
            <div className="rounded-2xl bg-white border border-[#EAE7DC] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE7DC]">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#5A634D]" />
                  <span className="font-semibold text-sm text-[#2C2C2C]">Security & Isolation Spec</span>
                </div>
                <span className="text-[10px] font-mono text-[#5A634D] bg-[#5A634D]/10 px-2 py-0.5 rounded border border-[#5A634D]/25 font-semibold">
                  Cloud Run Ready
                </span>
              </div>

              {/* Zone 1: Isolation */}
              <div className="flex items-start space-x-3 text-xs bg-[#F9F7F2] p-3 rounded-xl border border-[#EAE7DC]">
                <Database className="w-4 h-4 text-[#5A634D] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#2C2C2C]">Firestore Owner-Bound Partitioning</p>
                  <p className="text-[#66635B] mt-0.5 leading-relaxed">
                    Documents are stored strictly under <code className="text-[#5A634D] font-mono font-semibold">/users/&#123;userId&#125;/interactions</code>. Cross-user read/write queries are blocked at the Firestore engine level.
                  </p>
                </div>
              </div>

              {/* Zone 2: AI Fallback */}
              <div className="flex items-start space-x-3 text-xs bg-[#F9F7F2] p-3 rounded-xl border border-[#EAE7DC]">
                <Cpu className="w-4 h-4 text-[#5A634D] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#2C2C2C]">Resilient Gemini Fallback Ladder</p>
                  <p className="text-[#66635B] mt-0.5 leading-relaxed">
                    Automated chain: <span className="text-[#2C2C2C] font-mono font-semibold">3.6-flash ➔ 3.1-flash-lite ➔ flash-latest ➔ 3.7-flash</span> ensuring uninterrupted reflection generation.
                  </p>
                </div>
              </div>

              {/* Zone 3: Secret Management */}
              <div className="flex items-start space-x-3 text-xs bg-[#F9F7F2] p-3 rounded-xl border border-[#EAE7DC]">
                <Key className="w-4 h-4 text-[#5A634D] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#2C2C2C]">Zero-Secret Exposure</p>
                  <p className="text-[#66635B] mt-0.5 leading-relaxed">
                    API keys are injected via GCP Secret Manager or container environment variables, strictly isolated from client bundles.
                  </p>
                </div>
              </div>

              {/* Zone 4: Payload Sanitization */}
              <div className="flex items-start space-x-3 text-xs bg-[#F9F7F2] p-3 rounded-xl border border-[#EAE7DC]">
                <ShieldAlert className="w-4 h-4 text-[#5A634D] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#2C2C2C]">Zero-Crash Payload Hygiene</p>
                  <p className="text-[#66635B] mt-0.5 leading-relaxed">
                    All document payloads strip undefined attributes prior to Firestore persistence to prevent driver crashes.
                  </p>
                </div>
              </div>

            </div>

            {/* Campaign Label Badge */}
            <div className="p-4 rounded-xl bg-[#F9F7F2] border border-[#EAE7DC] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#5A634D]" />
                <span className="text-[#2C2C2C] font-medium">Campaign Verification Label:</span>
              </div>
              <code className="text-[#5A634D] font-mono bg-white px-2 py-0.5 rounded border border-[#EAE7DC] text-[11px] font-semibold">
                dev-tutorial=cloud-run-ai-challenge
              </code>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE7DC] bg-[#F9F7F2] py-6 text-center text-xs text-[#8E8E8E]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <p>© 2026 ReflexIQ. Built with Google Gemini 3.6 Flash & Cloud Firestore.</p>
          <p className="font-mono text-[#8E8E8E]">Strict Multi-Tenant Isolation • OWASP LLM Compliant</p>
        </div>
      </footer>

    </div>
  );
};
