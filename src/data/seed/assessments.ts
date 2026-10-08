import { HealthAssessment } from '@/types';
import { indigotexAssessment } from './indigotex';

/**
 * Production and primary seed assessments collection.
 * Indigotex quarterly health assessment.
 */
export const assessments: HealthAssessment[] = [indigotexAssessment];
