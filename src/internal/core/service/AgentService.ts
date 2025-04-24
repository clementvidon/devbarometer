import type { FetchPort } from '../port/FetchPort';
import type { LlmPort } from '../port/LlmPort';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts';
import { filterRelevantPosts } from '../../usecase/filterRelevantPosts';
import { analyzeSentiments } from '../../usecase/analyzeSentiments';
import { compressSentiments } from '../../usecase/compressSentiments';
import { generateSentimentReport } from '../../usecase/generateSentimentReport';

export class AgentService {
  constructor(
    private readonly fetcher: FetchPort,
    private readonly llm: LlmPort,
  ) {}

  async run(
    subreddit: string,
    limit: number,
    period: string,
  ): Promise<SentimentReport> {
    const posts = await fetchRedditPosts(
      this.fetcher,
      subreddit,
      limit,
      period,
    );
    console.log(posts);

    const relevantPosts = await filterRelevantPosts(posts, this.llm);
    console.log(relevantPosts);

    const sentimentPerPost = await analyzeSentiments(relevantPosts, this.llm);
    console.log(sentimentPerPost);

    const averageSentiment = compressSentiments(sentimentPerPost);
    console.log(averageSentiment);

    const report = await generateSentimentReport(averageSentiment, this.llm);
    return report;
  }
}
