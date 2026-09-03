/**
 * Data contracts and shared interfaces for ReflexIQ.
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
  createdAt: number;
}

export type ReflectionMode = "journal" | "brainstorm" | "reframe" | "summarize";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  modelUsed?: string;
  mode?: ReflectionMode;
}

export interface EntryAnalysis {
  title: string;
  summary: string;
  mood: string;
  sentimentScore: number;
  keyThemes: string[];
  actionItem: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: ReflectionMode;
  turns: ChatMessage[];
  summary?: string;
  mood?: string;
  sentimentScore?: number;
  keyThemes?: string[];
  actionItem?: string;
  isSyncedToFirestore: boolean;
}

export interface ThreatZoneCountermeasure {
  zone: string;
  threats: string[];
  countermeasures: string[];
  owaspReference: string;
  status: "Enforced" | "Verified";
}

export interface FunctionalTestCase {
  id: string;
  category: string;
  title: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  verificationMethod: string;
}
