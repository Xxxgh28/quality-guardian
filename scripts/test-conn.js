
const https = require('https');

console.log('Testing connection to api.openai.com...');

// Log periodically to keep process seemingly active
const interval = setInterval(() => {
  console.log('Waiting for response...');
}, 1000);

const req = https.request({
  hostname: 'api.openai.com',
  port: 443,
  path: '/',
  method: 'GET',
  timeout: 5000
}, (res) => {
  console.log('statusCode:', res.statusCode);
  clearInterval(interval);
});

req.on('error', (e) => {
  console.error('Connection error:', e);
  clearInterval(interval);
});

req.on('timeout', () => {
  console.error('Connection timeout');
  req.destroy();
  clearInterval(interval);
});

req.end();

