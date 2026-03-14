import 'dotenv/config';

import OpenAI from 'openai';

import { analyzeItemsRelevance } from '../../application/usecases/relevance/analyzeItemsRelevance';
import { RELEVANCE_CALIBRATION_FIXTURES } from '../../application/usecases/relevance/relevanceCalibration.fixture';
import type { Item } from '../../domain/entities';
import { OpenAIAdapter } from '../../infrastructure/llm/OpenAIAdapter';
import { makeLogger } from '../../infrastructure/logging/root';

function toCalibrationItems(): Item[] {
  return RELEVANCE_CALIBRATION_FIXTURES.map((fixture) => ({
    sourceFetchRef: `calibration:${fixture.itemRef}`,
    itemRef: fixture.itemRef,
    title: fixture.title,
    content: fixture.content,
    score: 0,
  }));
}

export async function runCalibration() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  const logger = makeLogger().child({
    tool: 'relevance.calibration',
  });
  const llm = new OpenAIAdapter(new OpenAI({ apiKey }), logger);
  const items = toCalibrationItems();

  const analyzed = await analyzeItemsRelevance(logger, items, llm, {
    gates: { enabled: false, topicMin: 0.55, genreMin: 0.6 },
  });

  const actualByRef = new Map(analyzed.map((item) => [item.itemRef, item]));

  const rows = RELEVANCE_CALIBRATION_FIXTURES.map((fixture) => {
    const actual = actualByRef.get(fixture.itemRef);
    return {
      itemRef: fixture.itemRef,
      expectedCategory: fixture.expectedCategory,
      actualCategory: actual?.category ?? 'missing',
      expectedRelevant: fixture.expectedRelevant,
      actualRelevant: actual?.relevant ?? false,
      topicScore: actual?.topicScore ?? 0,
      emotionScore: actual?.emotionScore ?? 0,
      genreScore: actual?.genreScore ?? 0,
    };
  });

  const matched = rows.filter(
    (row) =>
      row.expectedCategory === row.actualCategory &&
      row.expectedRelevant === row.actualRelevant,
  );
  const mismatches = rows.filter(
    (row) =>
      row.expectedCategory !== row.actualCategory ||
      row.expectedRelevant !== row.actualRelevant,
  );

  console.log(
    JSON.stringify(
      {
        total: rows.length,
        matched: matched.length,
        mismatches: mismatches.length,
      },
      null,
      2,
    ),
  );

  if (mismatches.length > 0) {
    console.log(JSON.stringify({ mismatches }, null, 2));
  }
}
