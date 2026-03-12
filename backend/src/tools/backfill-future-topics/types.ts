export type RedditBackfillConfig = {
  databaseUrl: string;
  redditClientId: string;
  redditClientSecret: string;
  redditUsername: string;
  redditPassword: string;
  subreddits: string[];
  timeRange: 'day' | 'week' | 'month' | 'year' | 'all';
  limit: number;
  minScore: number;
  sleepMs: number;
  userAgent: string;
};

export type RedditBackfillPostRow = {
  fetchedDay: string; // YYYY-MM-DD
  fetchedAt: string; // ISO
  subreddit: string;
  redditId: string;
  author: string;
  postName: string | null;
  permalink: string;
  title: string;
  selftext: string;
  url: string;
  domain: string;
  createdUtc: number | null;
  score: number;
  numComments: number;
  upvoteRatio: number | null;
  over18: boolean;
  isSelf: boolean;
  isVideo: boolean;
  linkFlairText: string;
  linkFlairType: string;
};
