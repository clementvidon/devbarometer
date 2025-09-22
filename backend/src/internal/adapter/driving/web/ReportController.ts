import express, { type Express } from 'express';
import type { Agent } from '../../../core/service/Agent';

export function makeReportController(agent: Agent): Express {
  const app = express();
  app.use(express.json());

  app.get('/report', async (_, res) => {
    const report = await agent.getLastReport();
    if (!report) return res.status(404).json({ error: 'No report found' });
    res.json(report);
  });

  app.post('/report', async (_, res) => {
    try {
      await agent.updateReport();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update report' });
    }
  });

  return app;
}
