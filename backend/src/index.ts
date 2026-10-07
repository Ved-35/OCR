import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`🚀 Server listening on http://localhost:${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
});
