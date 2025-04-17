import 'dotenv/config';
import { runAgent } from './agent';

export const run = async () => {
  const response = await runAgent();
  console.log(response);
};
