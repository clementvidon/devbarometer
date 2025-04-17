import 'dotenv/config';
import { runAgent } from './agent/runAgent.ts';

export const run = async () => {
  const response = await runAgent();
  console.log(response);
};
