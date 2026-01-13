
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

const token = jwt.sign(
  { id: 'debug-user', email: 'debug@example.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/reports/stock-usage?period=today',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('Fetching stock-usage...');

const req = http.request(options, res => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('--- API RESPONSE ---');
      if (json.debug) {
          console.log('Matched Count:', json.debug.matchedCount);
          console.log('Order Count:', json.debug.orderCount);
          console.log('Logs:');
          json.debug.logs.forEach(l => console.log(l));
      } else {
          console.log('No debug info found in response.');
          console.log('Full Response Keys:', Object.keys(json));
      }
      console.log('--- END ---');
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.log('Raw Data:', data);
    }
  });
});

req.on('error', error => {
  console.error('Request Error:', error);
});

req.end();
