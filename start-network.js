const { spawn } = require('child_process');
const os = require('os');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log('🌐 Network Access Setup');
console.log('======================');
console.log(`📱 Your Local IP: ${localIP}`);
console.log(`🔗 Frontend URL: http://${localIP}:5173`);
console.log(`🔗 Backend URL: http://${localIP}:5003`);
console.log('');

console.log('🚀 Starting servers...');
console.log('Press Ctrl+C to stop both servers');
console.log('');

// Start backend server
const backend = spawn('npm', ['run', 'dev'], {
  cwd: './',
  stdio: 'inherit',
  shell: true
});

// Start frontend server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: './client',
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping servers...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
});
