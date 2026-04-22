import { loadConfig } from '../lib/config.js';
import { HullAPI } from '../lib/api.js';

export async function infoCommand() {
  const config = await loadConfig();
  if (!config) {
    console.error('Error: No hull found. Run "hull deploy" first.');
    process.exit(1);
  }

  console.log('Hull Info');
  console.log('=========');
  console.log(`Endpoint:  ${config.endpoint}`);
  console.log(`Subdomain: ${config.subdomain}`);
  if (config.kvId) {
    console.log(`KV ID:     ${config.kvId}`);
  }

  try {
    const api = new HullAPI(config);
    const artifacts = await api.list();
    console.log(`Artifacts: ${artifacts.length}`);
    const expired = artifacts.filter((a) => Number(a.expires_at) * 1000 < Date.now()).length;
    if (expired > 0) {
      console.log(`  (including ${expired} expired)`);
    }
  } catch {
    console.log('Artifacts: (could not reach worker)');
  }
}
