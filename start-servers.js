import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Start Vite development server
const vite = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start proxy server
const proxy = spawn('node', ['proxy-server.js'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  vite.kill();
  proxy.kill();
  process.exit();
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  proxy.kill();
  process.exit(code);
});

proxy.on('close', (code) => {
  console.log(`Proxy process exited with code ${code}`);
  vite.kill();
  process.exit(code);
});
