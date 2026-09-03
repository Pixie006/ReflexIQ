import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  Lightbulb, 
  Compass, 
  BrainCircuit, 
  FileText, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import Markdown from "react-markdown";
import { UserProfile, JournalEntry, ChatMessage, ReflectionMode, EntryAnalysis } from "../types";
import { AIService } from "../services/aiService";
import { StorageService, stripUndefined } from "../services/firebaseService";

interface DashboardProps {
  user: UserProfile;
  onEntrySaved?: (entry: JournalEntry) => void;
  onViewHistory?: () => void;
}

const PROMPT_SUGGESTIONS: Record<ReflectionMode, string[]> = {
  journal: [
    "Unpack a complex decision I've been wrestling with today and challenge my underlying assumptions.",
    "Reflect on my emotional energy levels this week: what drained me and what gave me momentum?",
    "Examine an interaction where I felt misunderstood, and analyze both perspectives objectively."
  ],
  brainstorm: [
    "Brainstorm 3 contrarian architectural approaches to build a high-performance, privacy-first web application.",
    "Help me generate 5 rapid-experimentation strategies to validate a new AI product feature in under 48 hours.",
    "What are unaddressed edge cases when implementing strict multi-tenant data isolation?"
  ],
  reframe: [
    "I received critical feedback today that felt demoralizing. Help me reframe this into actionable growth.",
    "I feel overwhelmed by competing engineering priorities. Deconstruct this pressure into manageable levers.",
    "Reframe a recent project delay into an opportunity to harden security and system stability."
  ],
  summarize: [
    "Distill my raw thoughts into an executive 3-point briefing with clear next actions.",
    "Synthesize the key takeaways from my technical exploration into structured documentation.",
    "Extract actionable commitments and accountability metrics from my recent brainstorming session."
  ]
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onEntrySaved,
  onViewHistory
}) => {
  const [mode, setMode] = useState<ReflectionMode>("journal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string>(() => `entry_${Date.now()}`);
  const [entryTitle, setEntryTitle] = useState("Active Reflection Session");
  const [analysis, setAnalysis] = useState<EntryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Send message to Gemini 3.6 Flash fallback ladder
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    setErrorBanner(null);
    setSaveSuccessBanner(null);

    const userTurn: ChatMessage = {
      id: `turn_${Date.now()}_u`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
      mode
    };

    const updatedMessages = [...messages, userTurn];
    setMessages(updatedMessages);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await AIService.sendReflectionMessage({
        userId: user.uid,
        message: text.trim(),
        mode,
        history: messages
      });

      const assistantTurn: ChatMessage = {
        id: `turn_${Date.now()}_a`,
        role: "assistant",
        content: response.response,
        timestamp: Date.now(),
        modelUsed: response.modelUsed,
        mode
      };

      const finalMessages = [...updatedMessages, assistantTurn];
      setMessages(finalMessages);

      // Auto-save the updated multi-turn interaction to the user's isolated partition
      await autoSaveEntry(finalMessages, analysis);

    } catch (err: any) {
      console.error("Reflection turn error:", err);
      setErrorBanner(err?.message || "Failed to communicate with Gemini API. Check your network or API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  // Automated or manual save to user partition
  const autoSaveEntry = async (currentMessages: ChatMessage[], currentAnalysis: EntryAnalysis | null) => {
    if (currentMessages.length === 0) return;

    try {
      const firstUserMsg = currentMessages.find(m => m.role === "user")?.content || "Reflection Entry";
      const computedTitle = currentAnalysis?.title || entryTitle || firstUserMsg.slice(0, 45) + "...";

      const entryDoc: JournalEntry = {
        id: currentEntryId,
        userId: user.uid,
        title: computedTitle,
        createdAt: currentMessages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
        mode,
        turns: currentMessages,
        summary: currentAnalysis?.summary,
        mood: currentAnalysis?.mood,
        sentimentScore: currentAnalysis?.sentimentScore,
        keyThemes: currentAnalysis?.keyThemes,
        actionItem: currentAnalysis?.actionItem,
        isSyncedToFirestore: true
      };

      await StorageService.saveEntry(user.uid, entryDoc);
      setSaveSuccessBanner(`Saved to /users/${user.uid}/interactions/${currentEntryId}`);
      if (onEntrySaved) {
        onEntrySaved(entryDoc);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorBanner(`Persistence Error: ${err?.message || "Could not save to Firestore."}`);
    }
  };

  // Run AI Cognitive Analysis on transcript
  const handleAnalyzeSession = async () => {
    if (messages.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorBanner(null);

    try {
      const transcript = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const res = await AIService.analyzeEntryTranscript(transcript);
      setAnalysis(res.analysis);
      if (res.analysis.title) {
        setEntryTitle(res.analysis.title);
      }

      // Re-save with analysis metadata
      await autoSaveEntry(messages, res.analysis);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorBanner(err?.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset / New Session
  const handleNewSession = () => {
    setMessages([]);
    setInputMessage("");
    setAnalysis(null);
    setCurrentEntryId(`entry_${Date.now()}`);
    setEntryTitle("Active Reflection Session");
    setErrorBanner(null);
    setSaveSuccessBanner(null);
  };

  // Copy message content
  const copyContent = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Mode Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#EAE7DC] p-4 sm:p-5 rounded-2xl shadow-sm">
        
        {/* Left: Mode Tabs */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider">Cognitive Mode:</span>
            <span className="text-xs text-[#5A634D] font-mono font-semibold">/users/{user.uid}/interactions</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              id="mode-journal-btn"
              onClick={() => setMode("journal")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "journal"
                  ? "bg-[#5A634D] text-white font-semibold shadow-sm"
                  : "bg-[#F9F7F2] text-[#2C2C2C] hover:bg-[#F0EEE6] border border-[#EAE7DC]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cognitive Journal</span>
            </button>

            <button
              id="mode-brainstorm-btn"
              onClick={() => setMode("brainstorm")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "brainstorm"
                  ? "bg-[#5A634D] text-white font-semibold shadow-sm"
                  : "bg-[#F9F7F2] text-[#2C2C2C] hover:bg-[#F0EEE6] border border-[#EAE7DC]"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Strategic Brainstorm</span>
            </button>

            <button
              id="mode-reframe-btn"
              onClick={() => setMode("reframe")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "reframe"
                  ? "bg-[#5A634D] text-white font-semibold shadow-sm"
                  : "bg-[#F9F7F2] text-[#2C2C2C] hover:bg-[#F0EEE6] border border-[#EAE7DC]"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Mindset Reframe</span>
            </button>

            <button
              id="mode-summarize-btn"
              onClick={() => setMode("summarize")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "summarize"
                  ? "bg-[#5A634D] text-white font-semibold shadow-sm"
                  : "bg-[#F9F7F2] text-[#2C2C2C] hover:bg-[#F0EEE6] border border-[#EAE7DC]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Executive Summary</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2.5">
          {messages.length > 0 && (
            <button
              id="analyze-insights-btn"
              onClick={handleAnalyzeSession}
              disabled={isAnalyzing}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#F5F2EA] hover:bg-[#EAE7DC] text-[#5A634D] border border-[#D8D0C1] text-xs font-semibold transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <div className="w-3.5 h-3.5 border-2 border-[#5A634D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#5A634D]" />
              )}
              <span>{analysis ? "Re-Analyze Insights" : "Extract Insights"}</span>
            </button>
          )}

          <button
            id="save-entry-btn"
            onClick={() => autoSaveEntry(messages, analysis)}
            disabled={messages.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#5A634D] hover:bg-[#484F3D] text-white text-xs font-medium transition-all shadow-sm disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-white" />
            <span>Save to Firestore</span>
          </button>

          <button
            id="new-session-btn"
            onClick={handleNewSession}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs font-medium transition-all cursor-pointer"
            title="Start new reflection"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#8E8E8E]" />
            <span>Reset</span>
          </button>
        </div>

      </div>

      {/* Banners */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button 
            onClick={() => setErrorBanner(null)} 
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {saveSuccessBanner && (
        <div className="p-3 rounded-xl bg-[#F5F2EA] border border-[#D8D0C1] text-[#5A634D] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#5A634D] flex-shrink-0" />
            <span className="font-mono">{saveSuccessBanner}</span>
          </div>
          <span className="text-[10px] bg-[#5A634D]/15 text-[#5A634D] px-2 py-0.5 rounded font-mono font-semibold">
            Isolated & Verified
          </span>
        </div>
      )}

      {/* Main Grid: Chat Workspace + Cognitive Insights Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Conversation Stream & Input */}
        <div className="lg:col-span-8 flex flex-col bg-[#F9F7F2] border border-[#EAE7DC] rounded-2xl shadow-sm min-h-[580px] overflow-hidden">
          
          {/* Stream Header */}
          <div className="px-5 py-3 border-b border-[#EAE7DC] bg-white flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#5A634D]" />
              <span className="font-semibold text-[#2C2C2C]">{entryTitle}</span>
            </div>
            <span className="text-[#8E8E8E] font-mono text-[11px]">{messages.length} turns recorded</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 max-h-[520px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#EAE7DC] border border-[#D8D0C1] flex items-center justify-center text-[#5A634D]">
                  <Sparkles className="w-7 h-7" />
                </div>
                
                <div className="max-w-md space-y-1">
                  <h3 className="text-lg font-serif italic font-semibold text-[#2C2C2C]">
                    Begin Your Multi-Turn Reflection
                  </h3>
                  <p className="text-xs text-[#8E8E8E] leading-relaxed">
                    Share your current thoughts, dilemmas, or strategic ideas. Gemini 3.6 Flash will respond with structured questions and cognitive mirrors.
                  </p>
                </div>

                {/* Suggestions */}
                <div className="w-full max-w-lg space-y-2 text-left">
                  <p className="text-[11px] font-bold text-[#8E8E8E] uppercase tracking-wider px-1">
                    Quick Starting Inquiries ({mode}):
                  </p>
                  {PROMPT_SUGGESTIONS[mode].map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(promptText)}
                      className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-[#F0EEE6] border border-[#EAE7DC] hover:border-[#5A634D]/40 text-xs text-[#2C2C2C] transition-all flex items-start space-x-2.5 group cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#5A634D] mt-0.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      <span className="line-clamp-2 leading-relaxed">{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex items-start space-x-3 ${
                    msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-[#5A634D] text-white shadow-sm"
                        : "bg-[#EAE7DC] border border-[#D8D0C1] text-[#5A634D]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-white border border-[#EAE7DC] text-[#2C2C2C] rounded-tr-none shadow-sm"
                        : "bg-[#EAE7DC] border border-[#D8D0C1] text-[#2C2C2C] rounded-tl-none shadow-sm"
                    }`}
                  >
                    {/* Metadata Header for Assistant */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D8D0C1] text-[11px] text-[#8E8E8E]">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-4 h-4 bg-[#5A634D] rounded flex items-center justify-center text-white">
                            <Sparkles className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-mono text-[#5A634D] font-bold text-xs">{msg.modelUsed || "gemini-3.6-flash"}</span>
                        </div>
                        <button
                          onClick={() => copyContent(msg.content, index)}
                          className="flex items-center space-x-1 text-[#8E8E8E] hover:text-[#5A634D] transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-[#5A634D]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="text-[10px]">{copiedIndex === index ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}

                    {/* Markdown Body */}
                    <div className="markdown-body text-xs sm:text-sm space-y-2 text-[#2C2C2C] leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-2 text-[10px] text-[#8E8E8E] text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#EAE7DC] border border-[#D8D0C1] text-[#5A634D] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-[#EAE7DC] border border-[#D8D0C1] text-xs text-[#5A634D] flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#5A634D] rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-[#5A634D] rounded-full animate-pulse [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#5A634D] rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                  <span className="font-medium">Gemini 3.6 Flash reasoning through reflection...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-[#EAE7DC] bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                id="reflection-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Share your thoughts with ReflexIQ (${mode})...`}
                disabled={isLoading}
                className="flex-1 bg-[#FDFCF8] border-2 border-[#EAE7DC] focus:border-[#5A634D] rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#2C2C2C] placeholder-[#8E8E8E] focus:outline-none transition-all"
              />
              <button
                id="send-reflection-btn"
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-5 py-3.5 rounded-xl bg-[#5A634D] hover:bg-[#484F3D] text-white font-bold transition-all shadow-sm disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Cognitive Insights & Security Proof */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Analysis & Synthesis Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE7DC] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7DC]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#5A634D]" />
                <h3 className="font-semibold text-xs text-[#2C2C2C]">Session Cognitive Synthesis</h3>
              </div>
              {analysis && (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 rounded-full">
                  AI Parsed
                </span>
              )}
            </div>

            {analysis ? (
              <div className="space-y-4 text-xs animate-in fade-in duration-300">
                
                {/* Mood & Sentiment */}
                <div className="flex items-center justify-between bg-[#F9F7F2] p-3 rounded-xl border border-[#EAE7DC]">
                  <div>
                    <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider font-semibold">Dominant Mood</span>
                    <p className="font-bold text-[#5A634D] text-sm mt-0.5">{analysis.mood}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider font-semibold">Sentiment Index</span>
                    <div className="flex items-center space-x-1.5 justify-end mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#5A634D]" />
                      <span className="font-mono font-bold text-[#5A634D]">
                        {(analysis.sentimentScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-[#F9F7F2] p-3 rounded-xl border border-[#EAE7DC] space-y-1">
                  <span className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wider">Executive Synthesis:</span>
                  <p className="text-[#2C2C2C] leading-relaxed text-[11px]">{analysis.summary}</p>
                </div>

                {/* Key Themes */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wider">Key Cognitive Themes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keyThemes.map((theme, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#F5F2EA] border border-[#EAE7DC] rounded-md text-[10px] text-[#5A634D] font-medium">
                        #{theme}
                      </span>
                    ))}
                  </div>
                </div>

                {/* High Leverage Action */}
                <div className="bg-[#EAE7DC] border border-[#D8D0C1] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-[#5A634D] uppercase tracking-wider flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>High-Leverage Action</span>
                  </span>
                  <p className="text-[#2C2C2C] font-medium text-xs leading-snug">{analysis.actionItem}</p>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <BrainCircuit className="w-8 h-8 text-[#D8D0C1] mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs text-[#2C2C2C] font-semibold">No Insights Extracted Yet</p>
                  <p className="text-[11px] text-[#8E8E8E] max-w-[200px] mx-auto leading-relaxed">
                    Converse with Gemini and click "Extract Insights" to generate real-time executive summaries.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Isolation Inspector Widget */}
          <div className="p-4 rounded-2xl bg-white border border-[#EAE7DC] shadow-sm text-xs space-y-3">
            <div className="flex items-center space-x-2 text-[#5A634D]">
              <Lock className="w-4 h-4" />
              <span className="font-semibold text-[#2C2C2C]">Owner-Bound Path Guard</span>
            </div>
            
            <div className="bg-[#F9F7F2] p-2.5 rounded-lg border border-[#EAE7DC] text-[11px] font-mono space-y-1">
              <p className="text-[#8E8E8E] text-[10px]">Target Document Collection:</p>
              <p className="text-[#5A634D] break-all font-semibold">/users/{user.uid}/interactions</p>
            </div>

            <p className="text-[11px] text-[#66635B] leading-relaxed">
              Every save operation executes with <span className="text-[#2C2C2C] font-mono font-semibold">request.auth.uid == userId</span> verification. Different authenticated users have zero read or query permissions across partitions.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
