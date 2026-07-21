import http from 'http';

const data = JSON.stringify({ identifier: 'test@example.com', password: 'password123' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => console.log('BODY', body));
});

req.on('error', (e) => console.error('REQUEST ERROR', e));
req.write(data);
req.end();
