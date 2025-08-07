import type {
  AggregatedEmotionProfile,
  EmotionProfile,
} from '../../core/entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../../core/entity/EmotionProfileReport.ts';
import type { Post, RelevantPost } from '../../core/entity/Post.ts';

export type PipelineSnapshot = {
  id: string;
  createdAt: string;
  subreddit: string;
  fetchUrl: string;
  posts: Post[];
  relevantPosts: RelevantPost[];
  emotionProfilePerPost: EmotionProfile[];
  aggregatedEmotionProfile: AggregatedEmotionProfile;
  report: EmotionProfileReport;
};
