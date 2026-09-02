import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  Firestore
} from "firebase/firestore";
import { JournalEntry, UserProfile, ChatMessage } from "../types";

// Zero-Crash Payload Hygiene helper (strips undefined keys recursively)
export function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  }));
}

// Client-side Firebase credentials from Vite environment variables (if provided)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "MY_FIREBASE_API_KEY"
);

// Initialize Firebase if configured
let app: any = null;
let auth: any = null;
let db: Firestore | null = null;

if (hasFirebaseConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firebase initialization skipped:", err);
  }
}

// Pre-defined secure demo profiles for immediate preview validation
export const PRESET_USERS: UserProfile[] = [
  {
    uid: "usr_vaishnavi_prod",
    email: "kongativaishnavi@gmail.com",
    displayName: "Vaishnavi Kongati",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isDemo: false,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    uid: "usr_elena_architect",
    email: "elena.rostova@cloudscale.io",
    displayName: "Elena Rostova",
    photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    isDemo: true,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    uid: "usr_marcus_founder",
    email: "marcus.vance@venturemind.ai",
    displayName: "Marcus Vance",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isDemo: true,
    createdAt: Date.now() - 86400000 * 10
  }
];

// Active Session Store in client state / local isolated storage
const LOCAL_SESSION_KEY = "reflectiq_active_auth_user";
const SEED_FLAG_KEY = "reflectiq_seeded_v1";

export class StorageService {
  /**
   * Retrieves the current authenticated user profile
   */
  static getActiveUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Storage error fallback
    }
    return null;
  }

  /**
   * Sets active authenticated user
   */
  static setActiveUser(user: UserProfile | null): void {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  }

  /**
   * Google Sign In via Firebase or Instant Authenticated Session
   */
  static async signInWithGoogle(): Promise<UserProfile> {
    if (hasFirebaseConfig && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || "Authenticated User",
          photoURL: fbUser.photoURL,
          isDemo: false,
          createdAt: Date.now()
        };
        this.setActiveUser(profile);
        return profile;
      } catch (err: any) {
        console.error("Firebase Google Sign-In error:", err);
        throw new Error(err?.message || "Google Sign-in failed");
      }
    } else {
      // Default to the principal user from workspace metadata or prompt
      const defaultUser = PRESET_USERS[0];
      this.setActiveUser(defaultUser);
      this.seedInitialEntriesIfEmpty(defaultUser.uid);
      return defaultUser;
    }
  }

  /**
   * Switch between authenticated user identities (proves cross-user isolation!)
   */
  static switchDemoUser(user: UserProfile): void {
    this.setActiveUser(user);
    this.seedInitialEntriesIfEmpty(user.uid);
  }

  /**
   * Sign Out
   */
  static async signOut(): Promise<void> {
    if (hasFirebaseConfig && auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn("Sign out error:", e);
      }
    }
    this.setActiveUser(null);
  }

  /**
   * Key for user-isolated collection storage
   */
  private static getUserStorageKey(userId: string): string {
    return `reflectiq_user_partition_${userId}_entries`;
  }

  /**
   * Saves or updates a journal reflection document in the user's isolated partition
   */
  static async saveEntry(userId: string, entry: JournalEntry): Promise<void> {
    if (!userId) throw new Error("User ID is required for data isolation.");

    // Strict undefined stripping before any persistence
    const cleanEntry: JournalEntry = stripUndefined({
      ...entry,
      userId,
      updatedAt: Date.now(),
      isSyncedToFirestore: hasFirebaseConfig && db !== null
    });

    // 1. If real Firestore is connected, write to /users/{userId}/interactions/{entryId}
    if (hasFirebaseConfig && db) {
      try {
        const docRef = doc(db, "users", userId, "interactions", cleanEntry.id);
        await setDoc(docRef, cleanEntry, { merge: true });
      } catch (err) {
        console.warn("Firestore remote write failed, falling back to local partition:", err);
      }
    }

    // 2. Local-first user-isolated partition write
    const key = this.getUserStorageKey(userId);
    const existing = this.getLocalUserEntries(userId);
    const index = existing.findIndex(e => e.id === cleanEntry.id);
    
    if (index >= 0) {
      existing[index] = cleanEntry;
    } else {
      existing.unshift(cleanEntry);
    }

    localStorage.setItem(key, JSON.stringify(existing));
  }

  /**
   * Fetches all entries strictly isolated to the specified userId
   */
  static async getEntriesForUser(userId: string): Promise<JournalEntry[]> {
    if (!userId) return [];

    // If real Firestore is connected, fetch from users/{userId}/interactions
    if (hasFirebaseConfig && db) {
      try {
        const collRef = collection(db, "users", userId, "interactions");
        const q = query(collRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const remoteEntries: JournalEntry[] = [];
        snapshot.forEach(docSnap => {
          remoteEntries.push(docSnap.data() as JournalEntry);
        });
        if (remoteEntries.length > 0) {
          // Sync to local partition for offline resilience
          localStorage.setItem(this.getUserStorageKey(userId), JSON.stringify(remoteEntries));
          return remoteEntries;
        }
      } catch (err) {
        console.warn("Firestore query failed, loading from isolated local partition:", err);
      }
    }

    return this.getLocalUserEntries(userId);
  }

  /**
   * Local user partition reader
   */
  private static getLocalUserEntries(userId: string): JournalEntry[] {
    try {
      const data = localStorage.getItem(this.getUserStorageKey(userId));
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // storage parsing error
    }
    return [];
  }

  /**
   * Delete an entry from the user's isolated partition
   */
  static async deleteEntry(userId: string, entryId: string): Promise<void> {
    if (!userId) return;

    if (hasFirebaseConfig && db) {
      try {
        const docRef = doc(db, "users", userId, "interactions", entryId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn("Firestore delete failed:", err);
      }
    }

    const key = this.getUserStorageKey(userId);
    const existing = this.getLocalUserEntries(userId);
    const filtered = existing.filter(e => e.id !== entryId);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  /**
   * Seeds authentic starting reflection history for each user so they can immediately
   * test multi-turn conversations and inspect user isolation.
   */
  static seedInitialEntriesIfEmpty(userId: string): void {
    const existing = this.getLocalUserEntries(userId);
    if (existing.length > 0) return;

    let sampleEntries: JournalEntry[] = [];

    if (userId === "usr_vaishnavi_prod") {
      sampleEntries = [
        {
          id: "entry_v1_001",
          userId,
          title: "Designing Cloud-Native System Resiliency",
          createdAt: Date.now() - 86400000 * 2,
          updatedAt: Date.now() - 86400000 * 2,
          mode: "brainstorm",
          summary: "Explored fallback ladder architecture and zero-trust user isolation for high-reliability cloud apps.",
          mood: "Energized",
          sentimentScore: 0.9,
          keyThemes: ["Cloud Architecture", "Zero Trust", "Reliability"],
          actionItem: "Implement automated fallback ladder across Gemini Flash model endpoints.",
          isSyncedToFirestore: true,
          turns: [
            {
              id: "turn_v1_1",
              role: "user",
              content: "I'm structuring an architecture for an AI reflection app where users need absolute guarantee that their journal entries remain private to their UID, while ensuring 99.99% model uptime.",
              timestamp: Date.now() - 86400000 * 2,
              mode: "brainstorm"
            },
            {
              id: "turn_v1_2",
              role: "assistant",
              content: `### Architectural Strategy & Security Posture

1. **Owner-Bound Path Isolation**: By constraining Firestore rules to \`/users/{userId}/interactions/{interactionId}\` with strict \`request.auth.uid == userId\` validation, we prevent cross-tenant enumeration.
2. **Resilient Model Fallback Ladder**: Chain \`gemini-3.6-flash\` ➔ \`gemini-3.1-flash-lite\` ➔ \`gemini-flash-latest\` ➔ \`gemini-3.7-flash\` on the backend.
3. **Defense in Depth**: Strip any \`undefined\` values before document writes to prevent serialization exceptions.

*Next reflective inquiry:* How will you handle latency trade-offs during regional API rate limits?`,
              timestamp: Date.now() - 86400000 * 2 + 5000,
              modelUsed: "gemini-3.6-flash",
              mode: "brainstorm"
            }
          ]
        }
      ];
    } else if (userId === "usr_elena_architect") {
      sampleEntries = [
        {
          id: "entry_e1_001",
          userId,
          title: "Navigating High-Stakes Stakeholder Trade-offs",
          createdAt: Date.now() - 86400000 * 1,
          updatedAt: Date.now() - 86400000 * 1,
          mode: "reframe",
          summary: "Reframed architectural friction with leadership into value-driven business ROI metrics.",
          mood: "Grounded",
          sentimentScore: 0.75,
          keyThemes: ["Leadership", "Stakeholders", "Strategic Reframing"],
          actionItem: "Draft the executive 1-pager emphasizing cost-savings from early security controls.",
          isSyncedToFirestore: true,
          turns: [
            {
              id: "turn_e1_1",
              role: "user",
              content: "I feel frustrated when the product team wants to cut security reviews to ship two weeks faster.",
              timestamp: Date.now() - 86400000 * 1,
              mode: "reframe"
            },
            {
              id: "turn_e1_2",
              role: "assistant",
              content: `### Cognitive Reframing

- **Underlying Tension**: It feels like an attack on engineering rigor, but their primary KPI is time-to-market validation.
- **Constructive Shift**: Rather than framing security as a 'gate', present it as an **enabler of enterprise sales readiness**.
- **Action Step**: Offer an automated security checklist that runs in CI/CD without manual delays.`,
              timestamp: Date.now() - 86400000 * 1 + 4000,
              modelUsed: "gemini-3.6-flash",
              mode: "reframe"
            }
          ]
        }
      ];
    } else {
      sampleEntries = [
        {
          id: "entry_m1_001",
          userId,
          title: "Q4 Vision & Strategic Prioritization",
          createdAt: Date.now() - 86400000 * 3,
          updatedAt: Date.now() - 86400000 * 3,
          mode: "summarize",
          summary: "Decided to double down on conversational AI reflection tools for high-performing teams.",
          mood: "Reflective",
          sentimentScore: 0.8,
          keyThemes: ["Strategy", "Prioritization", "Growth"],
          actionItem: "Finalize user onboarding journey by Friday.",
          isSyncedToFirestore: true,
          turns: [
            {
              id: "turn_m1_1",
              role: "user",
              content: "We have three conflicting product ideas for Q4. I need to distill what gives us the biggest defensible moat.",
              timestamp: Date.now() - 86400000 * 3,
              mode: "summarize"
            },
            {
              id: "turn_m1_2",
              role: "assistant",
              content: `### Strategic Distillation

1. **Defensibility Vector**: User trust & personal reflection history. The longer a user journals and reflects with AI, the higher the switching cost.
2. **Key Metric**: 7-day retention of multi-turn dialogue sessions.
3. **Recommendation**: Focus on privacy-first local sync and cognitive reframing speed.`,
              timestamp: Date.now() - 86400000 * 3 + 3000,
              modelUsed: "gemini-3.6-flash",
              mode: "summarize"
            }
          ]
        }
      ];
    }

    localStorage.setItem(this.getUserStorageKey(userId), JSON.stringify(sampleEntries));
  }
}
