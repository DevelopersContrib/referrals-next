/**
 * Base integration interface for third-party services.
 * All integration wrappers should implement this interface.
 */
export interface Integration {
  /** Human-readable name of the integration */
  name: string;

  /** Test the connection / credentials */
  testConnection(): Promise<boolean>;

  /** Disconnect / clean up */
  disconnect(): Promise<void>;
}

/**
 * Result type for integration operations
 */
export interface IntegrationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Event types that can be fired to integrations
 */
export type IntegrationEventType =
  | "participant.signup"
  | "participant.share"
  | "participant.reward"
  | "campaign.created"
  | "campaign.updated"
  | "campaign.deleted";

/**
 * Payload shape for integration events
 */
export interface IntegrationEvent {
  type: IntegrationEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Helper to create a standardized integration event
 */
export function createIntegrationEvent(
  type: IntegrationEventType,
  data: Record<string, unknown>
): IntegrationEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}
