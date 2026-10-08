import { MonthlyMetrics } from '@/types';
import { indigotexMetrics } from './indigotex';

/**
 * Production and primary seed metrics collection.
 * Indigotex Private Limited is the sole active venture.
 */
export const metrics: MonthlyMetrics[] = [...indigotexMetrics];
