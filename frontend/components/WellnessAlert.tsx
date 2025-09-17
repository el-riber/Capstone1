"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Phone, ExternalLink, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CrisisDetectionService } from "../lib/crisisDetection";

type Severity = "low" | "medium" | "high";
type FlagType = "extended_low" | "rapid_cycling" | "concerning_text" | "missing_entries";

interface CrisisFlag {
  type: FlagType;
  severity: Severity;
  description: string;
  recommendation: string;
  entries_affected?: any[];
}

interface WellnessAlertProps {
  flags: CrisisFlag[];
  onDismiss?: (flagType: string) => void;
  
  missingDaysThreshold?: number;
}

const CRISIS_RESOURCES = [
  { name: "National Suicide Prevention Lifeline", phone: "988", description: "24/7 crisis support" },
  { name: "Crisis Text Line", phone: "Text HOME to 741741", description: "24/7 text support" },
  {
    name: "International Association for Suicide Prevention",
    url: "https://www.iasp.info/resources/Crisis_Centres/",
    description: "Global crisis centers",
  },
];

export const WellnessAlert: React.FC<WellnessAlertProps> = ({
  flags,
  onDismiss,
  missingDaysThreshold = 14,
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<FlagType>>(new Set());

  const fetchLatest = async (uid: string) => {
    
    const { data: enh, error: enhErr } = await supabase
      .from("enhanced_mood_entries")
      .select("created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1);

    
    const { data: simple, error: simErr } = await supabase
      .from("mood_entries")
      .select("created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1);

    if (enhErr) console.warn("enhanced_mood_entries error:", enhErr);
    if (simErr) console.warn("mood_entries error:", simErr);

    const candidates: Date[] = [];
    if (enh?.[0]?.created_at) candidates.push(new Date(enh[0].created_at as string));
    if (simple?.[0]?.created_at) candidates.push(new Date(simple[0].created_at as string));

    if (!candidates.length) {
      setDaysSince(Infinity); 
      return;
    }

    const latest = new Date(Math.max(...candidates.map((d) => d.getTime())));
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
    setDaysSince(diffDays);
  };

  
  useEffect(() => {
    (async () => {
      const { data: { user } = {} } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      fetchLatest(user.id);
    })();
  }, []);

  
  useEffect(() => {
    if (!userId) return;
    const refresh = () => fetchLatest(userId);
    window.addEventListener("mood-entry-saved", refresh);

    
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchLatest(userId);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("mood-entry-saved", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  
  const mergedFlags: CrisisFlag[] = useMemo(() => {
    const base = [...flags];

    
    const withoutIncomingMissing = base.filter((f) => f.type !== "missing_entries");

    if (daysSince == null) return withoutIncomingMissing;

    if (Number.isFinite(daysSince) && daysSince < missingDaysThreshold) {
      
      return withoutIncomingMissing;
    }

    
    let severity: Severity = "medium";
    if (!Number.isFinite(daysSince)) {
      severity = "high";
    } else if (daysSince >= missingDaysThreshold * 2) {
      severity = "high";
    } else if (daysSince >= missingDaysThreshold) {
      severity = "medium";
    }

    const daysLabel = Number.isFinite(daysSince) ? `${daysSince} day${daysSince === 1 ? "" : "s"}` : "a while";
    const description = Number.isFinite(daysSince)
      ? `No mood entries for ${daysLabel}.`
      : "No mood entries yet.";
    const recommendation =
      "Consider a quick daily check-in — regular tracking helps detect patterns early.";

    const missingFlag: CrisisFlag = {
      type: "missing_entries",
      severity,
      description,
      recommendation,
    };

    return [...withoutIncomingMissing, missingFlag];
  }, [flags, daysSince, missingDaysThreshold]);

  
  const visibleFlags = useMemo(
    () => mergedFlags.filter((f) => !dismissed.has(f.type)),
    [mergedFlags, dismissed]
  );

  if (!visibleFlags.length) return null;

  const highSeverityFlags = visibleFlags.filter((f) => f.severity === "high");
  const showEmergencyResources = highSeverityFlags.length > 0;

  const handleDismiss = (flagType: FlagType) => {
    setDismissed((prev) => new Set(prev).add(flagType));
    onDismiss?.(flagType);
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleFlags.map((flag, index) => (
        <div
          key={`${flag.type}-${index}`}
          className={`border rounded-lg p-4 ${CrisisDetectionService.getSeverityColor(flag.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 ${
                  flag.severity === "high"
                    ? "text-red-600"
                    : flag.severity === "medium"
                    ? "text-orange-600"
                    : "text-yellow-600"
                }`}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  {flag.severity === "high"
                    ? "High Priority Alert"
                    : flag.severity === "medium"
                    ? "Attention Needed"
                    : "Wellness Notice"}
                </h4>
                <p className="text-sm mb-2">{flag.description}</p>
                <p className="text-sm font-medium">{flag.recommendation}</p>

                {flag.severity === "high" && (
                  <div className="mt-3 p-3 bg-white/70 rounded border">
                    <p className="text-xs font-semibold text-red-800 mb-2">IMMEDIATE SUPPORT RECOMMENDED</p>
                    <p className="text-xs text-red-700">
                      Please reach out to someone you trust, a mental health professional, or use the crisis
                      resources below. You don’t have to handle this alone.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDismiss(flag.type)}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {showEmergencyResources && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            Crisis Resources
          </h4>
          <div className="space-y-3">
            {CRISIS_RESOURCES.map((resource, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-red-800">{resource.name}</div>
                {"phone" in resource && resource.phone && (
                  <div className="text-red-700">
                    <a
                      href={
                        resource.phone.startsWith("Text")
                          ? undefined
                          : `tel:${resource.phone.replace(/\D/g, "")}`
                      }
                      className="hover:underline font-mono"
                    >
                      {resource.phone}
                    </a>
                  </div>
                )}
                {"url" in resource && resource.url && (
                  <div className="text-red-700">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center"
                    >
                      Visit resource <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
                <div className="text-red-600 text-xs">{resource.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-white/70 rounded text-xs text-red-800">
            <strong>Remember:</strong> If you’re having thoughts of self-harm or suicide, please reach out immediately.
            Crisis counselors are available 24/7 and want to help.
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>Disclaimer:</strong> This crisis detection system is a support tool and may not catch all concerning
        patterns. It should never replace professional mental health assessment. If you’re concerned, seek professional help.
      </div>
    </div>
  );
};
