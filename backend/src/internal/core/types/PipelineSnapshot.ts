import type { Post, RelevantPost } from '../../core/entity/Post.ts';
import type {
  AverageSentiment,
  Sentiment,
} from '../../core/entity/Sentiment.ts';
import type { SentimentReport } from '../../core/entity/SentimentReport.ts';

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
