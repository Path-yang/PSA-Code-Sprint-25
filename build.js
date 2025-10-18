import { execSync } from 'node:child_process';

try {
  execSync('npm run build --workspace my_solution/frontend', {
    stdio: 'inherit',
    env: { ...process.env, ROLLUP_SKIP_NODE_NATIVE: 'true' }
  });
} catch (err) {
  process.exitCode = err.status ?? 1;
}
