import { getRedditDataPoints } from '../reddit/redditData.ts';
import { filterDataPoints } from './filterDataPoints';
import { analyzeSentiments } from './analyzeSentiments.ts';
import { compressSentiments } from './compressSentiments.ts';
import { interpretSentiment } from './interpretSentiment.ts';

export const runAgent = async (): Promise<string[]> => {
  const dataPoints = await getRedditDataPoints('developpeurs', 100, 'week');
  const relevantDataPoints = await filterDataPoints(dataPoints);
  const sentiments = await analyzeSentiments(relevantDataPoints);
  const sentiment = await compressSentiments(sentiments);
  const report = await interpretSentiment(sentiment);
  return report;
};
