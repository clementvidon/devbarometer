import express, { type Express } from 'express';

import type { SnapshotQueryPort } from '../../application/ports/input/SnapshotQueryPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';

export function makeReportController(
  logger: LoggerPort,
  query: SnapshotQueryPort,
): Express {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    const requestId = globalThis.crypto.randomUUID();
    req.logger = logger.child({ requestId });
    next();
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get('/report', async (req, res) => {
    const reqLogger = req.logger ?? logger;
    try {
      const report = await query.getLastReport();
      if (!report) {
        reqLogger.warn('No report found');
        return res.status(404).json({ error: 'No report found' });
      }
      res.json(report);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      reqLogger.warn(
        'Failed to load report',
        { path: '/report', method: 'GET' },
        error,
      );
      res.status(500).json({ error: 'Failed to load report' });
    }
  });

  return app;
}
