import type { FetchPort } from '../port/FetchPort';
import type { LlmPort } from '../port/LlmPort';
import type { PersistencePort } from '../port/PersistencePort';
import type { SentimentReport } from '../entity/SentimentReport';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts';
import { filterRelevantPosts } from '../../usecase/filterRelevantPosts';
import { analyzeSentiments } from '../../usecase/analyzeSentiments';
import { compressSentiments } from '../../usecase/compressSentiments';
import { generateSentimentReport } from '../../usecase/generateSentimentReport';
import { makeRedditTopUrl } from '../../../utils/redditUrl';

export class AgentService {
  constructor(
    private readonly fetcher: FetchPort,
    private readonly llm: LlmPort,
    private readonly persistence: PersistencePort,
  ) {}

  async run(
    subreddit: string,
    limit: number,
    period: string,
  ): Promise<SentimentReport> {
    const fetchUrl = makeRedditTopUrl(subreddit, limit, period);

    const posts = await fetchRedditPosts(
      this.fetcher,
      subreddit,
      limit,
      period,
    );
    console.log(
      `[AgentService] Fetched ${posts.length} top posts from "r/${subreddit}" for the past ${period}.`,
    );

    const relevantPosts = await filterRelevantPosts(posts, this.llm);
    console.log(
      `[AgentService] Selected ${relevantPosts.length}/${posts.length} posts relevant to the tech job market.`,
    );

    const sentimentPerPost = await analyzeSentiments(relevantPosts, this.llm);
    console.log(
      '[AgentService] Completed sentiment analysis on selected posts.',
    );

    const averageSentiment = compressSentiments(sentimentPerPost);
    console.log('[AgentService] Computed average sentiment:', averageSentiment);

    const report = await generateSentimentReport(averageSentiment, this.llm);
    console.log('[AgentService] Generated final sentiment report.');

    await this.persistence.storeSnapshot({
      subreddit,
      fetchUrl: fetchUrl,
      posts,
      relevantPosts,
      sentimentPerPost,
      averageSentiment,
      report,
    });
    return report;
  }
}
