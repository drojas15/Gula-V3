/**
 * EVENT BUS
 * 
 * Simple event-driven architecture for health score recalculation.
 * 
 * Events that trigger recalculation:
 * 1. LabResultsIngested - New exam uploaded
 * 2. BiomarkerValueEdited - Manual correction
 * 3. MonthlyHealthSnapshot - Monthly cycle closure
 * 
 * Events that DO NOT trigger recalculation:
 * - ActionCompleted
 * - DailyHabitTracking
 */

export type EventType = 
  | 'LabResultsIngested'
  | 'BiomarkerValueEdited'
  | 'MonthlyHealthSnapshot';

export interface BaseEvent {
  type: EventType;
  userId: string;
  timestamp: Date;
}

export interface LabResultsIngestedEvent extends BaseEvent {
  type: 'LabResultsIngested';
  examId: string;
  examDate: Date; // CRITICAL: Real exam date (when exam was taken), NOT upload date
  biomarkerValues: Array<{
    biomarker: string;
    value: number;
    unit: string;
  }>;
}

export interface BiomarkerValueEditedEvent extends BaseEvent {
  type: 'BiomarkerValueEdited';
  examId: string;
  biomarker: string;
  oldValue: number;
  newValue: number;
}

export interface MonthlyHealthSnapshotEvent extends BaseEvent {
  type: 'MonthlyHealthSnapshot';
  month: string; // YYYY-MM
}

export type AppEvent = 
  | LabResultsIngestedEvent
  | BiomarkerValueEditedEvent
  | MonthlyHealthSnapshotEvent;

type EventHandler = (event: AppEvent) => Promise<void>;

class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Emit an event
   */
  async emit(event: AppEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    // Execute all handlers in parallel
    await Promise.all(handlers.map(handler => handler(event)));
  }

  /**
   * Remove all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();

