import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

try {
  execSync('npm run build --workspace frontend', {
    stdio: 'inherit',
    env: { ...process.env, ROLLUP_SKIP_NODE_NATIVE: 'true' }
  });

  const source = join(process.cwd(), 'frontend/dist');
  const target = join(process.cwd(), 'dist');

  console.log(`[build] copying ${source} -> ${target}`);

  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }

  cpSync(source, target, { recursive: true });
  console.log('[build] copy completed');
} catch (err) {
  process.exitCode = err.status ?? 1;
}
