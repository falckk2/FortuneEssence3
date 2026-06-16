/**
 * Apply migration 019 using Supabase Management API + Grok MCP OAuth token.
 * Run: node scripts/apply-migration-019.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PROJECT_REF = 'hvxggcskfwnayjvzdein';

function loadAccessToken() {
  const credPath = resolve(homedir(), '.grok', 'mcp_credentials.json');
  const creds = JSON.parse(readFileSync(credPath, 'utf8'));
  const entry = Object.values(creds).find((c) => c?.token_response?.access_token);
  if (!entry?.token_response?.access_token) {
    throw new Error('No Supabase MCP access token in ~/.grok/mcp_credentials.json — complete OAuth first');
  }
  return entry.token_response.access_token;
}

const sql = readFileSync(
  resolve(root, 'database/migrations/019_fix_rate_limit_rpc_timestamptz_array.sql'),
  'utf8'
);

const token = loadAccessToken();
const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`FAIL  HTTP ${res.status}: ${body}`);
  process.exit(1);
}

console.log('PASS  migration 019 applied via Management API');
if (body && body !== '[]' && body !== '{}') {
  console.log(body);
}