import type { FetchPort } from '../port/FetchPort';
import type { LlmPort } from '../port/LlmPort';
import { getRedditDataPoints } from '../../usecase/getRedditDataPoints';
import { filterDataPoints } from '../../usecase/filterDataPoints';
import { analyzeSentiments } from '../../usecase/analyzeSentiments';
import { compressSentiments } from '../../usecase/compressSentiments';
import { generateSentimentReport } from '../../usecase/generateSentimentReport';
import type { Report } from '../entity/Report';

export class AgentService {
  constructor(
    private readonly fetcher: FetchPort,
    private readonly llm: LlmPort,
  ) {}

  async run(subreddit: string, limit: number, period: string): Promise<Report> {
    const posts = await getRedditDataPoints(
      this.fetcher,
      subreddit,
      limit,
      period,
    );
    console.log(posts);
    // const posts = await fetchRedditPosts(this.fetcher, subreddit, limit, period);
    // console.log(posts);

    const relevantPosts = await filterDataPoints(posts, this.llm);
    console.log(relevantPosts);
    // const relevantPosts = await filterRelevantPosts(posts, this.llm);
    // console.log(relevantPosts);

    const sentimentPerPost = await analyzeSentiments(relevantPosts, this.llm);
    console.log(sentimentPerPost);

    const averageSentiment = compressSentiments(sentimentPerPost);
    console.log(averageSentiment);

    const report = await generateSentimentReport(averageSentiment, this.llm);

    return report;
  }
}
