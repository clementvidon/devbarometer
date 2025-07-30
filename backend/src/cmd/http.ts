import 'dotenv/config';
import { makeReportController } from '../internal/adapter/driving/web/ReportController.ts';
import { makeAgentService } from '../internal/core/service/makeAgentService.ts';

const agent = makeAgentService();
const app = makeReportController(agent);

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`→ http://localhost:${port}`));
