import 'dotenv/config';
import process from 'node:process';

import type { Server } from 'node:http';

import { buildApp } from './container';

void (async () => {
  const port = Number(process.env.PORT ?? 3000);

  let server: Server | undefined;
  let shutdown: (() => Promise<void>) | undefined;
  let shuttingDown = false;

  const handleShutdown = async (signal?: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    try {
      await shutdown?.();
    } catch (error) {
      console.error('Error while shutting down application', error);
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }

    if (signal) {
      process.exit(0);
    }
  };

  try {
    const appInstance = await buildApp();
    shutdown = appInstance.shutdown;
    server = appInstance.app.listen(port, () => {
      console.warn(`Identity service listening on port ${port}`);
    });

    process.once('SIGINT', () => {
      void handleShutdown('SIGINT');
    });
    process.once('SIGTERM', () => {
      void handleShutdown('SIGTERM');
    });
  } catch (error) {
    console.error('Failed to start service', error);
    await handleShutdown();
    process.exit(1);
  }
})();
