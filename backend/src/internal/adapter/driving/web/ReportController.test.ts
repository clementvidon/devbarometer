// backend/src/internal/adapter/driving/web/ReportController.test.ts
import request from 'supertest';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
  type MockInstance,
} from 'vitest';

import type { SentimentReport } from '../../../core/entity/SentimentReport.ts';
import type { AgentService } from '../../../core/service/AgentService.ts';
import { makeReportController } from './ReportController.ts';

/* ------------------------------------------------------------------ */
/* Helpers : signatures EXACTES attendues par AgentService            */
/* ------------------------------------------------------------------ */
type GetLastSentimentReport = () => Promise<SentimentReport | null>;
type UpdateReport = (
  subreddit?: string,
  limit?: number,
  period?: string,
) => Promise<void>;

// ------------------------------------------------------------------
// Mocks
let getLastSentimentReport: MockInstance<GetLastSentimentReport>;
let updateReport: MockInstance<UpdateReport>;
let agentStub: AgentService;

beforeEach(() => {
  getLastSentimentReport = vi.fn<GetLastSentimentReport>();
  updateReport = vi.fn<UpdateReport>();

  // ⬇️  on ne fournit QUE les méthodes publiques utilisées
  //     puis on caste en deux temps pour satisfaire TS
  agentStub = {
    getLastSentimentReport,
    updateReport,
  } as unknown as AgentService;
});

afterEach(() => vi.clearAllMocks());

/* --------------------------- GET /report ------------------------ */
test('GET /report → 200 avec un SentimentReport', async () => {
  const fakeReport: SentimentReport = {
    text: 'dark clouds ahead',
    emoji: '🌧️',
  };
  getLastSentimentReport.mockResolvedValue(fakeReport);

  const res = await request(makeReportController(agentStub)).get('/report');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(fakeReport);
});

test('GET /report → 404 quand aucun rapport', async () => {
  getLastSentimentReport.mockResolvedValue(null);

  const res = await request(makeReportController(agentStub)).get('/report');

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'No report found' });
});

/* --------------------------- POST /report ----------------------- */
test('POST /report → 200 quand updateReport réussit', async () => {
  updateReport.mockResolvedValue();

  const res = await request(makeReportController(agentStub)).post('/report');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

test('POST /report → 500 quand updateReport échoue', async () => {
  const boom = new Error('Boom');
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  updateReport.mockRejectedValue(boom);

  const res = await request(makeReportController(agentStub)).post('/report');

  expect(res.status).toBe(500);
  expect(res.body).toEqual({ error: 'Failed to update report' });
  expect(errorSpy).toHaveBeenCalledWith(boom);
});
