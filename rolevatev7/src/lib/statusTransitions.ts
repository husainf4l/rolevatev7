/**
 * Utility functions for application status transitions
 */

export type ApplicationStatus = 
  | 'PENDING' 
  | 'REVIEWED' 
  | 'SHORTLISTED' 
  | 'INTERVIEWED' 
  | 'OFFERED' 
  | 'HIRED' 
  | 'REJECTED' 
  | 'WITHDRAWN'
  | 'ANALYZED';

/**
 * Defines valid status transitions based on business logic
 * Each status maps to an array of statuses it can transition to
 * 
 * Business Rules:
 * - PENDING: Can be reviewed, analyzed, rejected, or withdrawn
 * - ANALYZED: Can transition to any active status (allows flexibility for AI analysis results)
 * - REVIEWED: Can be shortlisted, rejected, or withdrawn
 * - SHORTLISTED: Can be interviewed, rejected, or withdrawn  
 * - INTERVIEWED: Can be offered a position, rejected, or withdrawn
 * - OFFERED: Can be hired, rejected, or withdrawn
 * - HIRED, REJECTED, WITHDRAWN: Final states with no further transitions
 */
const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  'PENDING': ['REVIEWED', 'REJECTED', 'WITHDRAWN', 'ANALYZED'],
  'ANALYZED': ['REVIEWED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'WITHDRAWN'],
  'REVIEWED': ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  'SHORTLISTED': ['INTERVIEWED', 'REJECTED', 'WITHDRAWN'],
  'INTERVIEWED': ['OFFERED', 'REJECTED', 'WITHDRAWN'],
  'OFFERED': ['HIRED', 'REJECTED', 'WITHDRAWN'],
  'HIRED': [], // Final state - no transitions allowed
  'REJECTED': [], // Final state - no transitions allowed
  'WITHDRAWN': [], // Final state - no transitions allowed
};

/**
 * Checks if a status transition is valid
 * @param currentStatus The current application status
 * @param newStatus The status to transition to
 * @returns true if the transition is valid, false otherwise
 */
export const isValidStatusTransition = (
  currentStatus: string, 
  newStatus: string
): boolean => {
  const normalizedCurrent = currentStatus as ApplicationStatus;
  const normalizedNew = newStatus as ApplicationStatus;
  
  return VALID_STATUS_TRANSITIONS[normalizedCurrent]?.includes(normalizedNew) || false;
};

/**
 * Gets all valid next statuses for a given current status
 * @param currentStatus The current application status
 * @returns Array of valid next statuses
 */
export const getValidNextStatuses = (currentStatus: string): ApplicationStatus[] => {
  const normalized = currentStatus as ApplicationStatus;
  return VALID_STATUS_TRANSITIONS[normalized] || [];
};

/**
 * Checks if a status is a final state (no further transitions allowed)
 * @param status The status to check
 * @returns true if it's a final state, false otherwise
 */
export const isFinalStatus = (status: string): boolean => {
  const normalized = status as ApplicationStatus;
  return VALID_STATUS_TRANSITIONS[normalized]?.length === 0;
};