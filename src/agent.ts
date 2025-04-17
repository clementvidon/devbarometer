// import { getRedditDataPoints } from './redditData.ts';
import { runLLM } from './llm';

export const runAgent = async (): Promise<string[]> => {
  // const dataPoints = await getRedditDataPoints('developpeurs', 100, 'week');
  return runLLM('gpt-4o-mini', { role: 'user', content: 'say hello' });
};
