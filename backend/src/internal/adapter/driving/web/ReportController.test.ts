import request from 'supertest';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
  type MockInstance,
} from 'vitest';

import type { Report } from '../../../core/entity/Report.ts';
import type { Agent } from '../../../core/service/Agent.ts';
import { makeReportController } from './ReportController.ts';

type GetLastReport = () => Promise<Report | null>;
type UpdateReport = (
  subreddit?: string,
  limit?: number,
  period?: string,
) => Promise<void>;

let getLastReport: MockInstance<GetLastReport>;
let updateReport: MockInstance<UpdateReport>;
let agentStub: Agent;

beforeEach(() => {
  getLastReport = vi.fn<GetLastReport>();
  updateReport = vi.fn<UpdateReport>();

  agentStub = {
    getLastReport,
    updateReport,
  } as unknown as Agent;
});

afterEach(() => vi.clearAllMocks());

test('GET /report → 200 avec un Report', async () => {
  const fakeReport: Report = {
    text: 'dark clouds ahead',
    emoji: '🌧️',
  };
  getLastReport.mockResolvedValue(fakeReport);

  const res = await request(makeReportController(agentStub)).get('/report');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(fakeReport);
});

test('GET /report → 404 quand aucun rapport', async () => {
  getLastReport.mockResolvedValue(null);

  const res = await request(makeReportController(agentStub)).get('/report');

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'No report found' });
});

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
