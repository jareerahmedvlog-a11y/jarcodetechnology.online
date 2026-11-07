"use client";

import { AiErrorBoundary } from "@/components/ai/AiErrorBoundary";
import { JarcodeAIAssistant } from "@/components/ai/JarcodeAIAssistant";

/** Keep AI eager on mobile — delayed dynamic import felt like a broken/white UI. */
export function ClientAiShell() {
  return (
    <AiErrorBoundary>
      <JarcodeAIAssistant />
    </AiErrorBoundary>
  );
}
