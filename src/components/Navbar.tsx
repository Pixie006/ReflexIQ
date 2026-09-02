import React, { useState } from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  UserCheck, 
  Database, 
  Lock, 
  ChevronDown, 
  Terminal, 
  BookOpen, 
  CheckCircle2, 
  Layers
} from "lucide-react";
import { UserProfile } from "../types";
import { PRESET_USERS, StorageService } from "../services/firebaseService";

interface NavbarProps {
  user: UserProfile;
  activeTab: "dashboard" | "history" | "security" | "deployment" | "testing";
  setActiveTab: (tab: "dashboard" | "history" | "security" | "deployment" | "testing") => void;
  onSignOut: () => void;
  onSwitchUser: (u: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignOut,
  onSwitchUser
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#EAE7DC] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#5A634D] rounded-xl flex items-center justify-center text-white font-serif italic text-xl shadow-sm">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif italic font-semibold text-xl tracking-tight text-[#5A634D]">
                ReflectIQ
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 rounded-full tracking-wider uppercase">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E8E] hidden sm:block">AI Journal & User-Isolated Cloud Firestore</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#F9F7F2] p-1 rounded-xl border border-[#EAE7DC] text-sm">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-[#5A634D] text-white shadow-sm font-semibold"
                : "text-[#2C2C2C] hover:text-[#5A634D] hover:bg-[#F0EEE6]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Reflect Canvas</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "history"
                ? "bg-[#5A634D] text-white shadow-sm font-semibold"
                : "text-[#2C2C2C] hover:text-[#5A634D] hover:bg-[#F0EEE6]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Journal Archive</span>
          </button>

          <button
            id="nav-tab-security"
            onClick={() => setActiveTab("security")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "security"
                ? "bg-[#5A634D] text-white shadow-sm font-semibold"
                : "text-[#2C2C2C] hover:text-[#5A634D] hover:bg-[#F0EEE6]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Threat Model</span>
          </button>

          <button
            id="nav-tab-deployment"
            onClick={() => setActiveTab("deployment")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "deployment"
                ? "bg-[#5A634D] text-white shadow-sm font-semibold"
                : "text-[#2C2C2C] hover:text-[#5A634D] hover:bg-[#F0EEE6]"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Cloud Run Guide</span>
          </button>

          <button
            id="nav-tab-testing"
            onClick={() => setActiveTab("testing")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "testing"
                ? "bg-[#5A634D] text-white shadow-sm font-semibold"
                : "text-[#2C2C2C] hover:text-[#5A634D] hover:bg-[#F0EEE6]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Test Suite</span>
          </button>
        </nav>

        {/* User Identity & Switcher */}
        <div className="flex items-center space-x-3">
          {/* Isolation pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F9F7F2] border border-[#EAE7DC] rounded-lg text-[11px] text-[#2C2C2C]">
            <Lock className="w-3.5 h-3.5 text-[#5A634D]" />
            <span className="text-[#8E8E8E]">Partition:</span>
            <code className="text-[#5A634D] font-mono font-semibold">/users/{user.uid.slice(0, 10)}...</code>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              id="user-profile-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-1.5 pl-2.5 pr-2 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] rounded-xl transition-colors text-left"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt={user.displayName || "User"}
                className="w-7 h-7 rounded-lg object-cover border border-[#5A634D]/30"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#2C2C2C] leading-tight truncate max-w-[110px]">
                  {user.displayName || "User"}
                </p>
                <p className="text-[10px] text-[#8E8E8E] leading-none truncate max-w-[110px]">
                  {user.email || user.uid}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E8E8E]" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white border border-[#EAE7DC] rounded-xl shadow-2xl p-2 z-50 divide-y divide-[#EAE7DC] animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wider">Active Authenticated Identity</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/30 rounded">Isolated</span>
                  </div>
                  <p className="text-sm font-medium text-[#2C2C2C]">{user.displayName}</p>
                  <p className="text-xs text-[#8E8E8E] font-mono break-all">{user.email || user.uid}</p>
                  <div className="mt-2 text-[11px] text-[#2C2C2C] bg-[#F9F7F2] p-2 rounded border border-[#EAE7DC]">
                    <p className="font-semibold text-[#2C2C2C] mb-0.5">Firestore Security Path:</p>
                    <code className="text-[#5A634D] font-mono text-[10px] break-all font-semibold">/users/{user.uid}/interactions</code>
                  </div>
                </div>

                {/* Identity Switcher (To test multi-user isolation on the fly) */}
                <div className="py-2">
                  <p className="px-3 text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wider mb-1.5">
                    Switch Persona (Verify Cross-User Isolation)
                  </p>
                  {PRESET_USERS.map((preset) => (
                    <button
                      key={preset.uid}
                      id={`switch-user-${preset.uid}`}
                      onClick={() => {
                        onSwitchUser(preset);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                        preset.uid === user.uid
                          ? "bg-[#5A634D]/10 text-[#5A634D] font-medium border border-[#5A634D]/30"
                          : "text-[#2C2C2C] hover:bg-[#F9F7F2] hover:text-[#5A634D]"
                      }`}
                    >
                      <img
                        src={preset.photoURL || ""}
                        alt={preset.displayName || ""}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{preset.displayName}</p>
                        <p className="text-[10px] text-[#8E8E8E] truncate">{preset.email}</p>
                      </div>
                      {preset.uid === user.uid && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5A634D] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Sign Out */}
                <div className="pt-2">
                  <button
                    id="sign-out-button"
                    onClick={onSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-1.5 bg-[#F9F7F2] border-t border-[#EAE7DC] text-xs">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === "dashboard" ? "text-[#5A634D] font-semibold" : "text-[#8E8E8E]"
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>Reflect</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === "history" ? "text-[#5A634D] font-semibold" : "text-[#8E8E8E]"
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Archive</span>
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === "security" ? "text-[#5A634D] font-semibold" : "text-[#8E8E8E]"
          }`}
        >
          <ShieldCheck className="w-4 h-4 mb-0.5" />
          <span>Threats</span>
        </button>
        <button
          onClick={() => setActiveTab("deployment")}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === "deployment" ? "text-[#5A634D] font-semibold" : "text-[#8E8E8E]"
          }`}
        >
          <Terminal className="w-4 h-4 mb-0.5" />
          <span>Deploy</span>
        </button>
        <button
          onClick={() => setActiveTab("testing")}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === "testing" ? "text-[#5A634D] font-semibold" : "text-[#8E8E8E]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mb-0.5" />
          <span>Tests</span>
        </button>
      </div>
    </header>
  );
};
