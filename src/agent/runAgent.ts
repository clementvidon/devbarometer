import { getRedditDataPoints } from './getRedditDataPoints.ts';
import { filterDataPoints } from './filterDataPoints';
import { analyzeSentiments } from './analyzeSentiments.ts';
import { compressSentiments } from './compressSentiments.ts';
import { generateReport } from './generateReport.ts';
import type { sentimentReport } from './generateReport.ts';

export const runAgent = async (): Promise<sentimentReport> => {
  const dataPoints = await getRedditDataPoints('developpeurs', 100, 'week');
  const relevantDataPoints = await filterDataPoints(dataPoints);
  const sentiments = await analyzeSentiments(relevantDataPoints);
  const sentimentSummary = await compressSentiments(sentiments);
  const report = await generateReport(sentimentSummary);
  return report;
};
