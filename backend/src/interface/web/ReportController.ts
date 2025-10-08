import express, { type Express } from 'express';
import type { AgentPort } from '../../application/ports/AgentPort';
import type { QueryPort } from '../../application/ports/QueryPort';

export function makeReportController(
  agent: AgentPort,
  query: QueryPort,
): Express {
  const app = express();
  app.use(express.json());

  app.get('/report', async (_, res) => {
    const report = await query.getLastReport();
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
