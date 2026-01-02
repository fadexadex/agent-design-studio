import { v4 as uuidv4 } from 'uuid';
import { WorkflowState, ErrorRecord, updateState } from './WorkflowState';

/**
 * ErrorTracker tracks errors across implementation rounds to:
 * 1. Prevent the agent from repeating the same mistakes
 * 2. Provide context for self-correction prompts
 * 3. Build error history for debugging
 */
export class ErrorTracker {
  /**
   * Records an error in the workflow state
   */
  recordError(
    state: WorkflowState,
    errorType: ErrorRecord['errorType'],
    errorMessage: string,
    context?: string
  ): WorkflowState {
    const errorRecord: ErrorRecord = {
      id: uuidv4(),
      roundNumber: state.currentRound,
      errorType,
      errorMessage,
      context,
      resolved: false
    };

    return updateState(state, {
      errorHistory: [...state.errorHistory, errorRecord]
    });
  }

  /**
   * Marks an error as resolved
   */
  resolveError(state: WorkflowState, errorId: string): WorkflowState {
    const errorHistory = state.errorHistory.map(err =>
      err.id === errorId
        ? { ...err, resolved: true, resolvedAt: new Date() }
        : err
    );

    return updateState(state, { errorHistory });
  }

  /**
   * Marks all unresolved errors as resolved
   */
  resolveAllErrors(state: WorkflowState): WorkflowState {
    const now = new Date();
    const errorHistory = state.errorHistory.map(err =>
      err.resolved ? err : { ...err, resolved: true, resolvedAt: now }
    );

    return updateState(state, { errorHistory });
  }

  /**
   * Gets unresolved errors from the current or specified round
   */
  getUnresolvedErrors(
    state: WorkflowState,
    roundNumber?: number
  ): ErrorRecord[] {
    return state.errorHistory.filter(
      err =>
        !err.resolved &&
        (roundNumber === undefined || err.roundNumber === roundNumber)
    );
  }

  /**
   * Gets all errors from a specific round
   */
  getErrorsByRound(state: WorkflowState, roundNumber: number): ErrorRecord[] {
    return state.errorHistory.filter(err => err.roundNumber === roundNumber);
  }

  /**
   * Builds a context string for the AI prompt summarizing past errors.
   * This helps the agent avoid repeating mistakes.
   */
  getErrorContext(state: WorkflowState): string {
    const unresolvedErrors = this.getUnresolvedErrors(state);

    if (unresolvedErrors.length === 0) {
      return '';
    }

    const errorSummaries = unresolvedErrors.map((err, index) => {
      const parts = [`${index + 1}. [${err.errorType.toUpperCase()}] ${err.errorMessage}`];
      if (err.context) {
        parts.push(`   Context: ${err.context}`);
      }
      return parts.join('\n');
    });

    return `
⚠️ PREVIOUS ERRORS TO AVOID:
The following errors occurred in previous attempts. Please ensure your code does not repeat these mistakes:

${errorSummaries.join('\n\n')}

Please address these issues in your next implementation.
`.trim();
  }

  /**
   * Gets a structured error summary for debugging/logging
   */
  getErrorSummary(state: WorkflowState): ErrorSummary {
    const allErrors = state.errorHistory;
    const unresolvedErrors = this.getUnresolvedErrors(state);

    const byType: Record<string, number> = {};
    const byRound: Record<number, number> = {};

    for (const err of allErrors) {
      byType[err.errorType] = (byType[err.errorType] || 0) + 1;
      byRound[err.roundNumber] = (byRound[err.roundNumber] || 0) + 1;
    }

    return {
      totalErrors: allErrors.length,
      unresolvedCount: unresolvedErrors.length,
      resolvedCount: allErrors.length - unresolvedErrors.length,
      byType,
      byRound,
      recentErrors: unresolvedErrors.slice(-5)
    };
  }

  /**
   * Checks if a similar error has occurred before
   * Useful for detecting recurring patterns
   */
  hasSimilarError(state: WorkflowState, errorMessage: string): boolean {
    const normalizedMessage = this.normalizeErrorMessage(errorMessage);
    return state.errorHistory.some(
      err => this.normalizeErrorMessage(err.errorMessage) === normalizedMessage
    );
  }

  /**
   * Gets the count of similar errors
   */
  getSimilarErrorCount(state: WorkflowState, errorMessage: string): number {
    const normalizedMessage = this.normalizeErrorMessage(errorMessage);
    return state.errorHistory.filter(
      err => this.normalizeErrorMessage(err.errorMessage) === normalizedMessage
    ).length;
  }

  /**
   * Normalizes error messages for comparison
   * Removes line numbers, file paths, and other variable parts
   */
  private normalizeErrorMessage(message: string): string {
    return message
      .toLowerCase()
      .replace(/line \d+/g, 'line X')
      .replace(/at .*?:\d+:\d+/g, 'at FILE:X:X')
      .replace(/'.+?'/g, "'VALUE'")
      .replace(/".+?"/g, '"VALUE"')
      .replace(/\d+/g, 'N')
      .trim();
  }

  /**
   * Clears all error history (useful when starting fresh)
   */
  clearErrors(state: WorkflowState): WorkflowState {
    return updateState(state, { errorHistory: [] });
  }
}

/**
 * Structured error summary for debugging
 */
export interface ErrorSummary {
  totalErrors: number;
  unresolvedCount: number;
  resolvedCount: number;
  byType: Record<string, number>;
  byRound: Record<number, number>;
  recentErrors: ErrorRecord[];
}

// Export singleton instance for convenience
export const errorTracker = new ErrorTracker();
