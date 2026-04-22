import { loadConfig } from '../lib/config.js';
import { HullAPI } from '../lib/api.js';

export async function revokeCommand(id: string) {
  const config = await loadConfig();
  if (!config) {
    console.error('Error: No hull found. Run "hull deploy" first.');
    process.exit(1);
  }

  const api = new HullAPI(config);
  try {
    await api.revoke(id);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
  console.log(`Revoked ${id}. Link is now dead.`);
}
