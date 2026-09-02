import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { EntryHistory } from "./components/EntryHistory";
import { SecurityInspectorModal } from "./components/SecurityInspectorModal";
import { CloudRunDeploymentGuide } from "./components/CloudRunDeploymentGuide";
import { TestWalkthroughModal } from "./components/TestWalkthroughModal";
import { StorageService, PRESET_USERS } from "./services/firebaseService";
import { UserProfile, JournalEntry } from "./types";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => StorageService.getActiveUser());
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "security" | "deployment" | "testing">("dashboard");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Initialize and seed active user if not already set
  useEffect(() => {
    const existing = StorageService.getActiveUser();
    if (existing) {
      setUser(existing);
    }
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const authUser = await StorageService.signInWithGoogle();
      setUser(authUser);
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Sign-in failed:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSelectPersona = (persona: UserProfile) => {
    StorageService.switchDemoUser(persona);
    setUser(persona);
    setActiveTab("dashboard");
  };

  const handleSignOut = async () => {
    await StorageService.signOut();
    setUser(null);
  };

  const handleSwitchUser = (newPersona: UserProfile) => {
    StorageService.switchDemoUser(newPersona);
    setUser(newPersona);
  };

  // If unauthenticated, show the Landing Page
  if (!user) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        onSelectPersona={handleSelectPersona}
        isLoading={isAuthLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#5A634D]/20 selection:text-[#5A634D]">
      
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {activeTab === "dashboard" && (
          <Dashboard
            user={user}
            onViewHistory={() => setActiveTab("history")}
          />
        )}

        {activeTab === "history" && (
          <EntryHistory
            user={user}
          />
        )}

        {activeTab === "security" && (
          <SecurityInspectorModal />
        )}

        {activeTab === "deployment" && (
          <CloudRunDeploymentGuide />
        )}

        {activeTab === "testing" && (
          <TestWalkthroughModal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE7DC] bg-[#F9F7F2] py-4 text-center text-xs text-[#8E8E8E]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#5A634D]" />
            <span>Partition Isolation: <code className="text-[#5A634D] font-mono text-[11px] font-semibold">/users/{user.uid}/interactions</code></span>
          </div>
          <p className="font-mono text-[#8E8E8E] text-[11px]">
            ReflectIQ • Model: <span className="text-[#5A634D] font-semibold">gemini-3.6-flash</span> (Ladder Active) • Cloud Firestore
          </p>
        </div>
      </footer>

    </div>
  );
}
