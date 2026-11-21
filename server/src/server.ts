import app, { ready } from './app.js';
import { env } from './env.js';

if (!process.env.VERCEL) {
  ready()
    .then(() => app.listen(env.PORT, () => console.log(`Nirolax API on http://localhost:${env.PORT} (${env.DATA_SOURCE}, payments: ${env.PAYMENT_PROVIDER}, demo: ${env.DEMO_MODE})`)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export default app;
