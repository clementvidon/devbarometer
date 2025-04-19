import 'dotenv/config';
import { runAgent } from './src/agent/runAgent';
await runAgent().then(console.log);
