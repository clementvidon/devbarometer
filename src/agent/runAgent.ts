import { getRedditDataPoints } from '../reddit/redditData.ts';
import { filterDataPoints } from './filterDataPoints';
import { analyzeSentiments } from './analyzeSentiments.ts';
import { compressSentiments } from './compressSentiments.ts';

export const runAgent = async (): Promise<string[]> => {
  const dataPoints = await getRedditDataPoints('developpeurs', 100, 'week');
  console.log(dataPoints);

  const relevantDataPoints = await filterDataPoints(dataPoints);
  console.log(relevantDataPoints);

  const sentiments = await analyzeSentiments(relevantDataPoints);
  console.log(sentiments);

  const sentiment = await compressSentiments(sentiments);
  console.log(sentiment);

  return 'done';
};
