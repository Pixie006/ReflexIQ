import React, { useState } from "react";
import { 
  Terminal, 
  Copy, 
  Check, 
  Cloud, 
  Key, 
  Database, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ExternalLink 
} from "lucide-react";

export const CloudRunDeploymentGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SNIPPET_APIS = `gcloud services enable \\
  run.googleapis.com \\
  secretmanager.googleapis.com \\
  firestore.googleapis.com \\
  cloudbuild.googleapis.com`;

  const SNIPPET_SECRETS = `# 1. Create Secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Secret Accessor role to Cloud Run compute service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:\${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"`;

  const SNIPPET_RULES = `# Deploy security rules to Cloud Firestore
firebase deploy --only firestore:rules`;

  const SNIPPET_DEPLOY = `# Deploy ReflectIQ container service to Cloud Run with Secret Manager binding
gcloud run deploy reflectiq \\
  --source . \\
  --region us-central1 \\
  --allow-unauthenticated \\
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"`;

  const SNIPPET_VERIFICATION = `# Apply mandatory campaign verification label
gcloud run services update reflectiq \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge \\
  --region=us-central1`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-[#EAE7DC] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#5A634D]/10 border border-[#5A634D]/25 text-[#5A634D]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2C2C2C]">
                Google Cloud Run Deployment & Campaign Verification
              </h2>
              <p className="text-xs text-[#8E8E8E] mt-0.5">
                Production guide for GCP Secret Manager, Firestore rules, and Cloud Run service binding
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Label Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#F9F7F2] border border-[#5A634D]/30 rounded-xl text-xs">
          <Zap className="w-4 h-4 text-[#5A634D]" />
          <span className="text-[#2C2C2C] font-medium">Mandatory Label:</span>
          <code className="text-[#5A634D] font-mono font-bold">dev-tutorial=cloud-run-ai-challenge</code>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        
        {/* Step 1: Enable APIs */}
        <div className="bg-white border border-[#EAE7DC] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 flex items-center justify-center text-xs font-bold font-mono">1</span>
              <h3 className="font-bold text-sm text-[#2C2C2C]">Enable Required Google Cloud Services</h3>
            </div>
            <button
              onClick={() => copyCode(SNIPPET_APIS, "step1")}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs rounded-lg transition-colors cursor-pointer"
            >
              {copiedId === "step1" ? <Check className="w-3.5 h-3.5 text-[#5A634D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "step1" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs text-[#66635B]">Enables Cloud Run, Secret Manager, Firestore, and Cloud Build.</p>
          <div className="bg-[#F9F7F2] rounded-xl p-4 border border-[#EAE7DC] font-mono text-xs text-[#2C2C2C] overflow-x-auto">
            <pre>{SNIPPET_APIS}</pre>
          </div>
        </div>

        {/* Step 2: Secret Manager */}
        <div className="bg-white border border-[#EAE7DC] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 flex items-center justify-center text-xs font-bold font-mono">2</span>
              <h3 className="font-bold text-sm text-[#2C2C2C]">Configure Secret Manager & IAM Secret Accessor</h3>
            </div>
            <button
              onClick={() => copyCode(SNIPPET_SECRETS, "step2")}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs rounded-lg transition-colors cursor-pointer"
            >
              {copiedId === "step2" ? <Check className="w-3.5 h-3.5 text-[#5A634D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "step2" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs text-[#66635B]">Stores the Gemini API key securely in Secret Manager and grants access to the default Cloud Run runtime service account.</p>
          <div className="bg-[#F9F7F2] rounded-xl p-4 border border-[#EAE7DC] font-mono text-xs text-[#2C2C2C] overflow-x-auto">
            <pre>{SNIPPET_SECRETS}</pre>
          </div>
        </div>

        {/* Step 3: Deploy Firestore Security Rules */}
        <div className="bg-white border border-[#EAE7DC] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 flex items-center justify-center text-xs font-bold font-mono">3</span>
              <h3 className="font-bold text-sm text-[#2C2C2C]">Deploy Owner-Bound Firestore Security Rules</h3>
            </div>
            <button
              onClick={() => copyCode(SNIPPET_RULES, "step3")}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs rounded-lg transition-colors cursor-pointer"
            >
              {copiedId === "step3" ? <Check className="w-3.5 h-3.5 text-[#5A634D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "step3" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs text-[#66635B]">Ensures strict partition isolation where users cannot read or write to other users' interaction documents.</p>
          <div className="bg-[#F9F7F2] rounded-xl p-4 border border-[#EAE7DC] font-mono text-xs text-[#2C2C2C] overflow-x-auto">
            <pre>{SNIPPET_RULES}</pre>
          </div>
        </div>

        {/* Step 4: Deploy Cloud Run */}
        <div className="bg-white border border-[#EAE7DC] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 flex items-center justify-center text-xs font-bold font-mono">4</span>
              <h3 className="font-bold text-sm text-[#2C2C2C]">Deploy Containerized Application to Cloud Run</h3>
            </div>
            <button
              onClick={() => copyCode(SNIPPET_DEPLOY, "step4")}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs rounded-lg transition-colors cursor-pointer"
            >
              {copiedId === "step4" ? <Check className="w-3.5 h-3.5 text-[#5A634D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "step4" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs text-[#66635B]">Builds and deploys the Express full-stack application with Secret Manager environment mounts.</p>
          <div className="bg-[#F9F7F2] rounded-xl p-4 border border-[#EAE7DC] font-mono text-xs text-[#2C2C2C] overflow-x-auto">
            <pre>{SNIPPET_DEPLOY}</pre>
          </div>
        </div>

        {/* Step 5: Verification Binding */}
        <div className="bg-white border border-[#EAE7DC] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-[#5A634D]/10 text-[#5A634D] border border-[#5A634D]/25 flex items-center justify-center text-xs font-bold font-mono">5</span>
              <h3 className="font-bold text-sm text-[#2C2C2C]">Apply Automated Campaign Verification Label</h3>
            </div>
            <button
              onClick={() => copyCode(SNIPPET_VERIFICATION, "step5")}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#EAE7DC] text-[#2C2C2C] text-xs rounded-lg transition-colors cursor-pointer"
            >
              {copiedId === "step5" ? <Check className="w-3.5 h-3.5 text-[#5A634D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "step5" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs text-[#66635B]">Registers the service for the automated Cloud Run AI Challenge scoring bot.</p>
          <div className="bg-[#F9F7F2] rounded-xl p-4 border border-[#EAE7DC] font-mono text-xs text-[#2C2C2C] overflow-x-auto">
            <pre>{SNIPPET_VERIFICATION}</pre>
          </div>
        </div>

      </div>

    </div>
  );
};
