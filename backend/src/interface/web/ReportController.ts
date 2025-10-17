import express, { type Express } from 'express';
import type { ReportingAgentPort } from '../../application/ports/input/ReportingAgentPort';
import type { SnapshotQueryPort } from '../../application/ports/input/SnapshotQueryPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';

declare module 'express-serve-static-core' {
  interface Request {
    logger?: LoggerPort;
  }
}

export function makeReportController(
  logger: LoggerPort,
  agent: ReportingAgentPort,
  query: SnapshotQueryPort,
): Express {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    const requestId =
      globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    req.logger = logger.child({ requestId });
    next();
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
      reqLogger.error('Failed to load report', { error });
      res.status(500).json({ error: 'Failed to load report' });
    }
  });

  app.post('/report', async (req, res) => {
    const reqLogger = req.logger ?? logger;
    try {
      await agent.captureSnapshot();
      reqLogger.info('Report snapshot captured');
      res.json({ ok: true });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      reqLogger.error('Failed to update report', { error });
      res.status(500).json({ error: 'Failed to update report' });
    }
  });

  return app;
}
