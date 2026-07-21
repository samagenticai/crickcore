import 'dotenv/config';
import fetch from 'node-fetch';

const base = 'http://localhost:5000/api';
const loginCreds = { identifier: 'testuser@local.dev', password: 'Test1234!' };

const loginRes = await fetch(`${base}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginCreds),
});
console.log('login status', loginRes.status);
const loginText = await loginRes.text();
console.log('login body', loginText);
const cookie = loginRes.headers.get('set-cookie');
console.log('set-cookie', cookie);

const formData = new FormData();
formData.append('tournamentName', 'Test Tournament API');
formData.append('startDate', '2026-08-01');
formData.append('endDate', '2026-08-05');
formData.append('numberOfTeams', '8');
formData.append('overs', '20');

const createRes = await fetch(`${base}/tournaments`, {
  method: 'POST',
  headers: {
    Cookie: cookie || '',
  },
  body: formData,
});
console.log('create status', createRes.status);
console.log('create body', await createRes.text());
