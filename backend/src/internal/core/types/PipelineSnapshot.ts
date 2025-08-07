import type {
  AverageEmotionProfile,
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
  sentimentPerPost: EmotionProfile[];
  averageEmotionProfile: AverageEmotionProfile;
  report: EmotionProfileReport;
};
