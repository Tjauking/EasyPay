import { config, getSigningKeys } from './config.js';
import { ensureSchema, pool } from './db.js';
import { createServer } from './server.js';

async function main() {
  console.log('Ensuring DB schema...');
  await ensureSchema();
  await getSigningKeys();
  const app = createServer();
  const server = app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    server.close();
    await pool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});