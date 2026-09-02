import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Lock, 
  Tag, 
  CheckCircle2, 
  FileCode, 
  RefreshCw,
  Cpu,
  TrendingUp,
  Compass,
  BrainCircuit,
  Lightbulb,
  FileText,
  X
} from "lucide-react";
import Markdown from "react-markdown";
import { UserProfile, JournalEntry, ReflectionMode } from "../types";
import { StorageService } from "../services/firebaseService";

interface EntryHistoryProps {
  user: UserProfile;
  onOpenEntry?: (entry: JournalEntry) => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [activeEntryModal, setActiveEntryModal] = useState<JournalEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch entries strictly isolated to current active user
  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getEntriesForUser(user.uid);
      setEntries(data);
    } catch (err) {
      console.error("Error loading user entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user.uid]);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.keyThemes && entry.keyThemes.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      entry.turns.some(t => t.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = selectedMode === "all" || entry.mode === selectedMode;

    return matchesSearch && matchesMode;
  });

  // Handle entry deletion
  const handleDelete = async (entryId: string) => {
    try {
      await StorageService.deleteEntry(user.uid, entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
      if (activeEntryModal?.id === entryId) {
        setActiveEntryModal(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  // Export entry to Markdown file
  const exportToMarkdown = (entry: JournalEntry) => {
    const lines = [
      `# ${entry.title}`,
      `**Date:** ${new Date(entry.createdAt).toLocaleString()}`,
      `**Mode:** ${entry.mode.toUpperCase()}`,
      `**Mood:** ${entry.mood || "N/A"} | **Sentiment:** ${entry.sentimentScore ? (entry.sentimentScore * 100).toFixed(0) + "%" : "N/A"}`,
      `**Firestore Path:** /users/${user.uid}/interactions/${entry.id}`,
      "",
      `## Executive Summary`,
      entry.summary || "No automated summary extracted.",
      "",
      `## Key Themes`,
      entry.keyThemes ? entry.keyThemes.map(t => `- #${t}`).join("\n") : "- None",
      "",
      `## Transcript`,
      ...entry.turns.map(t => `### ${t.role === "user" ? "👤 User" : "🤖 Gemini 3.6 Flash (" + (t.modelUsed || "gemini-3.6-flash") + ")"}\n\n${t.content}\n`)
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title.replace(/[^a-zA-Z0-9]/g, "_")}_reflection.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getModeIcon = (m: ReflectionMode) => {
    switch (m) {
      case "brainstorm": return <Lightbulb className="w-3.5 h-3.5 text-[#5A634D]" />;
      case "reframe": return <BrainCircuit className="w-3.5 h-3.5 text-[#5A634D]" />;
      case "summarize": return <Compass className="w-3.5 h-3.5 text-[#5A634D]" />;
      default: return <FileText className="w-3.5 h-3.5 text-[#5A634D]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner: Isolation Verification */}
      <div className="bg-white border border-[#EAE7DC] p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#5A634D]" />
            <h2 className="text-lg font-serif font-bold text-[#2C2C2C]">
              Personal Reflection Archive
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-mono bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 rounded-full font-semibold">
              {entries.length} Total Saved
            </span>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Querying partition: <code className="text-[#5A634D] font-mono font-semibold">/users/{user.uid}/interactions</code>
          </p>
        </div>

        {/* Security Isolation Indicator */}
        <div className="flex items-center space-x-3 text-xs bg-[#F9F7F2] p-2.5 rounded-xl border border-[#EAE7DC]">
          <Lock className="w-4 h-4 text-[#5A634D] flex-shrink-0" />
          <div className="text-[11px]">
            <span className="font-semibold text-[#2C2C2C]">Owner-Bound Query Guarantee:</span>
            <span className="text-[#66635B] ml-1">Other users are prohibited from querying this partition.</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#EAE7DC] p-3 rounded-xl shadow-xs">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E8E8E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-entries-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, summaries, themes..."
            className="w-full bg-[#FDFCF8] border border-[#EAE7DC] focus:border-[#5A634D] rounded-lg pl-9 pr-3 py-2 text-xs text-[#2C2C2C] placeholder-[#8E8E8E] focus:outline-none"
          />
        </div>

        {/* Mode Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "journal", "brainstorm", "reframe", "summarize"].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                selectedMode === m
                  ? "bg-[#5A634D] text-white font-semibold shadow-xs"
                  : "bg-[#F9F7F2] text-[#2C2C2C] hover:bg-[#F0EEE6] border border-[#EAE7DC]"
              }`}
            >
              {m === "all" ? "All Modes" : m}
            </button>
          ))}
          
          <button
            onClick={loadEntries}
            className="p-1.5 rounded-lg bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#8E8E8E] hover:text-[#2C2C2C] transition-colors cursor-pointer"
            title="Refresh entries"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Entries Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#5A634D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8E8E8E] font-mono">Fetching isolated entries from Firestore...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-[#EAE7DC] rounded-2xl space-y-3 shadow-xs">
          <BookOpen className="w-10 h-10 text-[#D8D0C1] mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#2C2C2C]">No reflections found</p>
            <p className="text-xs text-[#8E8E8E] max-w-sm mx-auto">
              {searchQuery ? "No entries match your search query." : "You haven't saved any reflection sessions in this account yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl bg-white border border-[#EAE7DC] hover:border-[#5A634D]/50 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-[#F9F7F2] border border-[#EAE7DC] text-[11px] font-medium capitalize text-[#2C2C2C]">
                    {getModeIcon(entry.mode)}
                    <span>{entry.mode}</span>
                  </span>
                  
                  {entry.mood && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 rounded-full">
                      {entry.mood}
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-base text-[#2C2C2C] line-clamp-1 group-hover:text-[#5A634D] transition-colors">
                  {entry.title}
                </h3>

                <p className="text-xs text-[#66635B] line-clamp-2 leading-relaxed">
                  {entry.summary || entry.turns.find(t => t.role === "assistant")?.content.slice(0, 120) || "Multi-turn reflection dialogue."}
                </p>

                {/* Themes */}
                {entry.keyThemes && entry.keyThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.keyThemes.slice(0, 3).map((theme, i) => (
                      <span key={i} className="text-[10px] text-[#5A634D] bg-[#F5F2EA] px-2 py-0.5 rounded border border-[#EAE7DC] font-medium">
                        #{theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#EAE7DC] flex items-center justify-between text-xs text-[#8E8E8E]">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="text-[11px]">{entry.turns.length} turns</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveEntryModal(entry)}
                    className="p-1.5 rounded-lg bg-[#F9F7F2] hover:bg-[#F0EEE6] text-[#5A634D] transition-colors cursor-pointer border border-[#EAE7DC]"
                    title="View Full Transcript"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => exportToMarkdown(entry)}
                    className="p-1.5 rounded-lg bg-[#F9F7F2] hover:bg-[#F0EEE6] text-[#66635B] hover:text-[#2C2C2C] transition-colors cursor-pointer border border-[#EAE7DC]"
                    title="Export Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(entry.id)}
                    className="p-1.5 rounded-lg bg-[#F9F7F2] hover:bg-rose-50 text-[#8E8E8E] hover:text-rose-600 transition-colors cursor-pointer border border-[#EAE7DC]"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-[#2C2C2C]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE7DC] p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#2C2C2C]">Delete Reflection Document?</h3>
            <p className="text-xs text-[#66635B] leading-relaxed">
              This will permanently delete this document from <code className="text-[#5A634D] font-mono font-semibold">/users/{user.uid}/interactions/{deleteConfirmId}</code>. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-[#F9F7F2] text-[#2C2C2C] text-xs font-medium hover:bg-[#F0EEE6] border border-[#EAE7DC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Transcript Modal */}
      {activeEntryModal && (
        <div className="fixed inset-0 bg-[#2C2C2C]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE7DC] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE7DC] bg-[#F9F7F2] flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 rounded capitalize">
                    {activeEntryModal.mode}
                  </span>
                  <span className="text-xs text-[#8E8E8E] font-mono">
                    {new Date(activeEntryModal.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#2C2C2C]">
                  {activeEntryModal.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportToMarkdown(activeEntryModal)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs font-medium cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export MD</span>
                </button>
                <button
                  onClick={() => setActiveEntryModal(null)}
                  className="p-1.5 rounded-lg bg-white hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#8E8E8E] hover:text-[#2C2C2C] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm bg-[#FDFCF8]">
              
              {/* Executive Summary Card (if present) */}
              {activeEntryModal.summary && (
                <div className="p-4 rounded-xl bg-white border border-[#EAE7DC] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#5A634D] uppercase tracking-wider">
                      Cognitive Synthesis & Summary
                    </span>
                    {activeEntryModal.sentimentScore && (
                      <span className="text-[11px] font-mono text-[#5A634D] font-bold">
                        Sentiment: {(activeEntryModal.sentimentScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[#2C2C2C] leading-relaxed">{activeEntryModal.summary}</p>
                  {activeEntryModal.actionItem && (
                    <div className="pt-2 border-t border-[#EAE7DC] text-xs text-[#5A634D] font-semibold">
                      🎯 Action Item: {activeEntryModal.actionItem}
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Turn Dialogue Transcript */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">
                  Full Dialogue Transcript ({activeEntryModal.turns.length} turns)
                </h4>

                {activeEntryModal.turns.map((turn, i) => (
                  <div
                    key={turn.id || i}
                    className={`p-4 rounded-xl space-y-2 shadow-xs ${
                      turn.role === "user"
                        ? "bg-white border border-[#EAE7DC] text-[#2C2C2C]"
                        : "bg-[#EAE7DC] border border-[#D8D0C1] text-[#2C2C2C]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#8E8E8E] pb-1 border-b border-[#D8D0C1]">
                      <span className="font-semibold text-[#5A634D] flex items-center space-x-1">
                        <span>{turn.role === "user" ? "👤 User Reflection" : "🤖 Gemini 3.6 Flash"}</span>
                      </span>
                      <span className="font-mono text-[10px]">
                        {new Date(turn.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="markdown-body text-xs sm:text-sm text-[#2C2C2C] leading-relaxed">
                      <Markdown>{turn.content}</Markdown>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EAE7DC] bg-[#F9F7F2] flex items-center justify-between text-xs text-[#8E8E8E]">
              <span className="font-mono text-[11px]">
                Isolated Path: /users/{user.uid}/interactions/{activeEntryModal.id}
              </span>
              <button
                onClick={() => setActiveEntryModal(null)}
                className="px-5 py-1.5 rounded-xl bg-[#5A634D] hover:bg-[#484F3D] text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
