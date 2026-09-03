import React, { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Layers, 
  Terminal, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Database,
  ArrowRight
} from "lucide-react";
import { FunctionalTestCase } from "../types";

const TEST_CASES: FunctionalTestCase[] = [
  {
    id: "TC-01",
    category: "Authentication & Identity",
    title: "Google Sign-In & Federated Session Initialization",
    precondition: "User is on the Landing Page in an unauthenticated state.",
    steps: [
      "1. Click 'Continue with Google Sign-In' or select a test persona (e.g. Elena Rostova).",
      "2. Observe instant transition to the private Dashboard view.",
      "3. Inspect the navigation header for active user avatar, email, and target partition badge."
    ],
    expectedResult: "User identity is established without ever prompting for or storing plaintext passwords. Target partition reflects /users/{userId}/interactions.",
    verificationMethod: "Inspect localStorage('reflexiq_active_auth_user') and Navbar header identity."
  },
  {
    id: "TC-02",
    category: "AI Conversational Processing",
    title: "Multi-Turn Reflection Dialogue with Gemini 3.6 Flash",
    precondition: "User is authenticated and on the 'Reflect Canvas' tab.",
    steps: [
      "1. Select a Cognitive Mode (e.g., 'Cognitive Journal' or 'Strategic Brainstorm').",
      "2. Click a quick inquiry starter chip or type a custom prompt into the input bar.",
      "3. Submit the prompt by pressing Enter or clicking the Send icon.",
      "4. Type a follow-up reply in the same thread to test multi-turn contextual continuity."
    ],
    expectedResult: "Gemini 3.6 Flash returns a structured markdown response with empathetic questions, and maintains awareness of preceding turns in the conversation.",
    verificationMethod: "Inspect network request to /api/reflect and verify modelUsed: 'gemini-3.6-flash'."
  },
  {
    id: "TC-03",
    category: "Resilience & Fallback Protocol",
    title: "Resilient 4-Tier Model Fallback Ladder Verification",
    precondition: "Server-side environment executes generateContentWithFallback.",
    steps: [
      "1. Dispatch a reflection prompt.",
      "2. The server attempts gemini-3.6-flash.",
      "3. If transient rate limits or outages occur, the server sequentially steps down to gemini-3.1-flash-lite, gemini-flash-latest, or gemini-3.7-flash without bubbling an unhandled 500 error to the client."
    ],
    expectedResult: "Zero silent failure; active model badge in the assistant bubble reflects the successful ladder tier.",
    verificationMethod: "Inspect attempts array in /api/reflect JSON response."
  },
  {
    id: "TC-04",
    category: "Cognitive Intelligence",
    title: "Automated Transcript Analysis & Executive Synthesis",
    precondition: "At least one conversational turn is present in the active session.",
    steps: [
      "1. Click the 'Extract Insights' button in the toolbar.",
      "2. Observe the AI analysis spinner.",
      "3. Review the populated 'Session Cognitive Synthesis' card on the right sidebar."
    ],
    expectedResult: "Generates a 3-6 word title, mood indicator, sentiment percentage score, key thematic hashtags, and high-leverage action item.",
    verificationMethod: "Inspect network POST to /api/analyze-entry and state update on analysis."
  },
  {
    id: "TC-05",
    category: "Data Persistence & Hygiene",
    title: "Firestore Save & Zero Undefined Value Stripping",
    precondition: "Active conversation has been generated.",
    steps: [
      "1. Click 'Save to Firestore' or observe auto-save on turn completion.",
      "2. Inspect the green confirmation banner displaying the exact document path /users/{userId}/interactions/{id}.",
      "3. Verify that all payload objects are cleansed of undefined attributes via stripUndefined."
    ],
    expectedResult: "Document is securely committed to the user's isolated partition without Firestore serialization crashes.",
    verificationMethod: "Inspect localStorage('reflexiq_user_partition_{userId}_entries') or live Firestore collection."
  },
  {
    id: "TC-06",
    category: "Multi-Tenant Isolation",
    title: "Cross-User Isolation & Anti-Leakage Verification",
    precondition: "User A has saved reflections in their account.",
    steps: [
      "1. Note User A's entries in 'Journal Archive'.",
      "2. Click the user profile dropdown and select 'Switch Persona' (e.g. switch from Vaishnavi to Marcus).",
      "3. Navigate to 'Journal Archive'.",
      "4. Verify that User A's entries are completely invisible and only User B's entries are rendered."
    ],
    expectedResult: "Zero cross-user data leakage. Query targets /users/{userB.uid}/interactions strictly.",
    verificationMethod: "Compare entry lists across distinct user profiles."
  },
  {
    id: "TC-07",
    category: "Archive Management",
    title: "Search, Full Transcript Inspection, Markdown Export & Deletion",
    precondition: "User has multiple saved reflection entries.",
    steps: [
      "1. On 'Journal Archive', type a keyword in the search bar or filter by mode chip.",
      "2. Click the Eye icon to inspect the full transcript in the modal dialog.",
      "3. Click 'Export MD' to download a formatted Markdown file of the reflection.",
      "4. Click the Trash icon to delete an entry and confirm the removal dialog."
    ],
    expectedResult: "Instant client filtering, cleanly formatted Markdown download, and irreversible deletion from the user partition.",
    verificationMethod: "Check file download and verify document is removed from state and storage."
  }
];

export const TestWalkthroughModal: React.FC = () => {
  const [completedTests, setCompletedTests] = useState<Record<string, boolean>>({});

  const toggleTest = (id: string) => {
    setCompletedTests(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const completedCount = Object.values(completedTests).filter(Boolean).length;
  const progressPercent = (completedCount / TEST_CASES.length) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-[#EAE7DC] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#5A634D]/10 border border-[#5A634D]/25 text-[#5A634D]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2C2C2C]">
                Interactive Functional Walkthrough & Test Suite
              </h2>
              <p className="text-xs text-[#8E8E8E] mt-0.5">
                Comprehensive test specifications covering every user interaction, fallback tier, and security boundary
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center space-x-3 bg-[#F9F7F2] px-4 py-2.5 rounded-xl border border-[#EAE7DC] text-xs">
          <div className="text-right">
            <p className="text-[#8E8E8E] text-[10px]">Verification Progress</p>
            <p className="font-bold text-[#5A634D]">{completedCount} of {TEST_CASES.length} Verified ({progressPercent.toFixed(0)}%)</p>
          </div>
          <div className="w-16 h-2 bg-[#EAE7DC] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5A634D] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Test Case Cards */}
      <div className="space-y-4">
        {TEST_CASES.map((tc) => {
          const isDone = Boolean(completedTests[tc.id]);

          return (
            <div
              key={tc.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDone 
                  ? "bg-[#F9F7F2] border-[#5A634D]/40 shadow-xs"
                  : "bg-white border-[#EAE7DC] shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#F9F7F2] text-[#5A634D] border border-[#EAE7DC] rounded">
                      {tc.id}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8E8E8E] uppercase tracking-wider">
                      {tc.category}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#2C2C2C]">
                    {tc.title}
                  </h3>

                  <div className="text-xs text-[#66635B] space-y-1 pt-1">
                    <p><strong className="text-[#2C2C2C]">Precondition:</strong> {tc.precondition}</p>
                    <div className="space-y-0.5 pt-1">
                      <strong className="text-[#2C2C2C]">Execution Steps:</strong>
                      {tc.steps.map((step, idx) => (
                        <p key={idx} className="text-[#66635B] pl-2 font-mono text-[11px] leading-relaxed">
                          {step}
                        </p>
                      ))}
                    </div>
                    <p className="pt-1"><strong className="text-[#5A634D]">Expected Result:</strong> {tc.expectedResult}</p>
                    <p><strong className="text-[#5A634D]">Verification Sink:</strong> <code className="text-[#2C2C2C] font-mono text-[11px] bg-[#F9F7F2] px-1.5 py-0.5 rounded border border-[#EAE7DC]">{tc.verificationMethod}</code></p>
                  </div>
                </div>

                {/* Checkbox Button */}
                <button
                  onClick={() => toggleTest(tc.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ${
                    isDone
                      ? "bg-[#5A634D] text-white shadow-xs"
                      : "bg-[#F9F7F2] hover:bg-[#F0EEE6] text-[#2C2C2C] border border-[#EAE7DC]"
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-[#8E8E8E]" />
                      <span>Mark Verified</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
