import { getRedditDataPoints } from '../reddit/redditData.ts';

import { filterDataPoints } from './filterDataPoints';

export const runAgent = async (): Promise<string[]> => {
  const dataPoints = await getRedditDataPoints('developpeurs', 100, 'week');
  console.log(dataPoints);

  const relevantDataPoints = await filterDataPoints(dataPoints);
  console.log(relevantDataPoints);

  return 'done';
};
