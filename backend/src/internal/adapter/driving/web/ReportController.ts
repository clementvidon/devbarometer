import express, { type Express } from 'express';
import type { PersistencePort } from '../../../core/port/PersistencePort.ts';
import type { Agent } from '../../../usecase/agent/Agent.ts';
import { getLastReport } from '../../../usecase/queries/getLastReport.ts';

export function makeReportController(
  agent: Agent,
  persistence: PersistencePort,
): Express {
  const app = express();
  app.use(express.json());

  app.get('/report', async (_, res) => {
    const report = await getLastReport(persistence);
    if (!report) return res.status(404).json({ error: 'No report found' });
    res.json(report);
  });

  app.post('/report', async (_, res) => {
    try {
      await agent.captureSnapshot();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update report' });
    }
  });

  return app;
}
