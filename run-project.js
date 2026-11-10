const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// Tự động xác định thư mục gốc dự án (chứa pom.xml)
let rootDir = __dirname;
if (!fs.existsSync(path.join(rootDir, 'pom.xml')) && fs.existsSync(path.join(rootDir, '..', 'pom.xml'))) {
  rootDir = path.resolve(rootDir, '..');
}
const frontendDir = path.join(rootDir, 'frontend');

const isWindows = process.platform === 'win32';
const mvnCmd = isWindows ? path.join(rootDir, 'mvnw.cmd') : './mvnw';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Màu sắc terminal ANSI
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function logSystem(msg) {
  console.log(`${colors.green}${colors.bold}[System]${colors.reset} ${msg}`);
}

function attachLogger(child, name, color) {
  const prefix = `${color}${colors.bold}[${name}]${colors.reset}`;

  if (child.stdout) {
    const rlOut = readline.createInterface({ input: child.stdout });
    rlOut.on('line', (line) => {
      console.log(`${prefix} ${line}`);
    });
  }

  if (child.stderr) {
    const rlErr = readline.createInterface({ input: child.stderr });
    rlErr.on('line', (line) => {
      console.error(`${prefix} ${line}`);
    });
  }
}

function killProcess(pid) {
  if (!pid) return;
  if (isWindows) {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch (e) {}
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch (e) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (err) {}
    }
  }
}

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${colors.yellow}${colors.bold}[System] Đang dừng cả Backend và Frontend...${colors.reset}`);

  if (backendProcess) killProcess(backendProcess.pid);
  if (frontendProcess) killProcess(frontendProcess.pid);

  setTimeout(() => {
    process.exit(0);
  }, 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => {
  if (backendProcess) killProcess(backendProcess.pid);
  if (frontendProcess) killProcess(frontendProcess.pid);
});

// Xử lý tham số dòng lệnh
const args = process.argv.slice(2);
const runBackendOnly = args.includes('--backend');
const runFrontendOnly = args.includes('--frontend');

console.log(`${colors.cyan}${colors.bold}=====================================================${colors.reset}`);
console.log(`${colors.bold}  🚀 Generic Shop Fullstack Runner${colors.reset}`);
console.log(`  - Backend (Spring Boot):  http://localhost:8081`);
console.log(`  - Frontend (React Vite):  http://localhost:5173`);
console.log(`  - Nhấn ${colors.yellow}${colors.bold}Ctrl + C${colors.reset} để dừng toàn bộ tiến trình.`);
console.log(`${colors.cyan}${colors.bold}=====================================================${colors.reset}\n`);

// Khởi chạy Backend
if (!runFrontendOnly) {
  logSystem('Đang khởi chạy Backend (Spring Boot)...');
  backendProcess = spawn(mvnCmd, ['spring-boot:run'], {
    cwd: rootDir,
    shell: true,
    env: process.env,
  });

  attachLogger(backendProcess, 'Backend', colors.cyan);

  backendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      logSystem(`Backend đã dừng với mã thoát: ${code}`);
    }
  });
}

// Khởi chạy Frontend
if (!runBackendOnly) {
  logSystem('Đang khởi chạy Frontend (Vite)...');
  frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    env: process.env,
  });

  attachLogger(frontendProcess, 'Frontend', colors.magenta);

  frontendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      logSystem(`Frontend đã dừng với mã thoát: ${code}`);
    }
  });
}

