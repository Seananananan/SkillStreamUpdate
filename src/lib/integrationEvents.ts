import { randomUUID } from "crypto";
import type { IntegrationEvent, IntegrationEventType } from "./types";

export function makeIntegrationEvent(input: {
  enrollmentId: string;
  eventType: IntegrationEventType;
  payload: Record<string, unknown>;
  ok: boolean;
  error?: string;
  at: string;
}): IntegrationEvent {
  return {
    id: randomUUID(),
    enrollmentId: input.enrollmentId,
    eventType: input.eventType,
    payload: input.payload,
    status: input.ok ? "succeeded" : "failed",
    retryCount: 0,
    lastError: input.ok ? null : (input.error ?? "Handoff failed."),
    createdAt: input.at,
    processedAt: input.at,
  };
}
