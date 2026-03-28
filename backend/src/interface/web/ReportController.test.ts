import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';

import { NoopLoggerAdapter } from '../../infrastructure/logging/NoopLoggerAdapter';
import { makeReportController } from './ReportController';

describe('ReportController', () => {
  test('GET /health returns 200', async () => {
    const app = makeReportController(new NoopLoggerAdapter(), {
      getLastReport: vi.fn(),
      getAggregatedProfiles: vi.fn(),
      getTopHeadlines: vi.fn(),
    });

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  test('POST /report is not exposed', async () => {
    const app = makeReportController(new NoopLoggerAdapter(), {
      getLastReport: vi.fn(),
      getAggregatedProfiles: vi.fn(),
      getTopHeadlines: vi.fn(),
    });

    const response = await request(app).post('/report');
    expect(response.status).toBe(404);
  });
});
