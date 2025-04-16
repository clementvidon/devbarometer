import { getRedditDataPoints } from './redditData';

export const run = async () => {
  const dataPoints = await getRedditDataPoints('developpeurs', 100, 'week');
  console.log(dataPoints);
};
