import type { Post, RelevantPost } from '../../core/entity/Post.ts';
import type { SentimentReport } from '../../core/entity/SentimentReport';
import type { Sentiment, AverageSentiment } from '../../core/entity/Sentiment';

export type PipelineSnapshot = {
  id: string;
  createdAt: string;
  subreddit: string;
  fetchUrl: string;
  posts: Post[];
  relevantPosts: RelevantPost[];
  sentimentPerPost: Sentiment[];
  averageSentiment: AverageSentiment;
  report: SentimentReport;
};
