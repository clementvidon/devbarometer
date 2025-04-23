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
    const raw = await getRedditDataPoints(
      this.fetcher,
      subreddit,
      limit,
      period,
    );
    // const items = await fetchRedditData(this.fetcher, subreddit, limit, period);
    console.log(raw);

    const relevantDataPoints = await filterDataPoints(raw, this.llm);
    // const relevantItems = await filterRelevantItems(raw, this.llm);
    console.log(relevantDataPoints);

    const sentiments = await analyzeSentiments(relevantDataPoints, this.llm);
    // const sentimentPerItem = await analyzeSentiments(relevantDataPoints, this.llm);
    console.log(sentiments);

    const sentimentSummary = compressSentiments(sentiments);
    // const averageSentiment = compressSentiments(sentiments);
    console.log(sentimentSummary);

    const report = await generateSentimentReport(sentimentSummary, this.llm);
    // const report = await generateReport(sentimentSummary, this.llm);

    return report;
  }
}
