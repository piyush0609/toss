import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
function configFile() {
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    return join(home, '.hull', 'config.json');
}
export async function loadConfig() {
    try {
        const raw = await readFile(configFile(), 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function saveConfig(config) {
    const file = configFile();
    const dir = file.slice(0, file.lastIndexOf('/'));
    await mkdir(dir, { recursive: true });
    await writeFile(file, JSON.stringify(config, null, 2));
}
