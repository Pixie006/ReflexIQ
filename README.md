# ReflexIQ - AI Journal & User-Isolated Cloud Firestore Architecture

ReflexIQ is an AI-powered multi-turn reflective journaling and strategic brainstorming application built with **Google Gemini 3.6 Flash** and **Cloud Firestore**. It enforces strict, owner-bound data isolation so that users cannot query or read each other's reflection transcripts.

---

## 1. Threat Summary Table (The 5 Threat Zones)

| Threat Zone | Identified Risks | Countermeasures Implemented | OWASP Top 10 Standard |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Prompt Injection, oversized payloads, control bytes | Strict schema validation, defensive 1mb limit, character sanitization | OWASP A03 / LLM02 |
| **2. Planning & Reasoning** | API outages (503/429), prompt hijacking | 4-Tier Fallback Ladder (`gemini-3.6-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-flash-latest` ➔ `gemini-3.7-flash`), system prompt isolation | OWASP LLM01 / LLM05 |
| **3. Tool Execution** | SSRF, arbitrary code execution | Zero dynamic shell or eval execution, strict parameterization | OWASP A01 / LLM06 |
| **4. Memory & State** | Cross-tenant data leaks, driver crashes from `undefined` | Owner-bound Firestore rules `/users/{userId}/interactions`, zero-crash `undefined` stripping | OWASP A01 / A03 |
| **5. Inter-System Communication**| Client-side API key leakage, token sniffing | Backend proxy routes (`/api/*`), GCP Secret Manager dynamic injection | OWASP A02 / LLM07 |

---

## 2. Prerequisites & Cloud APIs

Ensure the `gcloud` CLI and Firebase CLI are installed and configured:

```bash
# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 3. Secret Management Setup (GCP Secret Manager)

ReflexIQ adheres to zero-hardcoding standards. Store your Gemini API Key in Secret Manager and grant the Cloud Run compute service account accessor privileges:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Firestore Security Rules Configuration

Deploy the following owner-bound rules in `firestore.rules` to enforce strict cryptographic separation of user reflections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/reflections/{reflectionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Google Cloud Run Deployment Flow

Deploy the containerized service directly from source with Secret Manager environment mounts:

```bash
gcloud run deploy reflexiq \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

---

## 6. Mandatory Campaign Verification Labeling

Apply the mandatory challenge label to register the deployed Cloud Run service for automated verification:

```bash
gcloud run services update reflexiq \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
