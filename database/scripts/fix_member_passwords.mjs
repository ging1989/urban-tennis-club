/**
 * One-time script: rehash bcrypt member passwords → scrypt
 *
 * Run:  node database/scripts/fix_member_passwords.mjs
 *
 * Resets every user whose stored password starts with $2b$ (bcrypt)
 * to NEW_PASSWORD hashed with scrypt (parameters match config/hash.ts).
 */

import mysql from 'mysql2/promise'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../../.env')
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
    }
  } catch {
    // .env not found – rely on process.env already set
  }
}

loadEnv()

const NEW_PASSWORD = 'Member1234'

// Matches config/hash.ts scrypt settings
const SCRYPT_COST          = 16384
const SCRYPT_BLOCK_SIZE    = 8
const SCRYPT_PARALLELISM   = 1
const SCRYPT_KEY_LENGTH    = 64   // bytes – matches AdonisJS default

async function makeScryptHash(password) {
  const salt = crypto.randomBytes(16)
  const key = await new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELISM,
    }, (err, derivedKey) => (err ? reject(err) : resolve(derivedKey)))
  )
  // PHC string format used by AdonisJS scrypt driver (no = padding)
  const saltB64 = salt.toString('base64').replace(/=+$/, '')
  const keyB64  = key.toString('base64').replace(/=+$/, '')
  return `$scrypt$n=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELISM}$${saltB64}$${keyB64}`
}

async function verifyScrypt(password, hash) {
  const parts = hash.split('$').filter(Boolean)
  const params = Object.fromEntries(parts[1].split(',').map(p => p.split('=')))
  const salt = Buffer.from(parts[2], 'base64')
  const stored = Buffer.from(parts[3], 'base64')
  const derived = await new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, stored.length, {
      N: parseInt(params.n),
      r: parseInt(params.r),
      p: parseInt(params.p),
    }, (err, key) => (err ? reject(err) : resolve(key)))
  )
  return derived.equals(stored)
}

const conn = await mysql.createConnection({
  host:     process.env.DB_HOST     ?? '127.0.0.1',
  port:     Number(process.env.DB_PORT ?? 3306),
  user:     process.env.DB_USER     ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'court_booking',
})

const [users] = await conn.execute(
  "SELECT id, email, role FROM users WHERE password LIKE '$2b$%' OR password LIKE '$2a$%'"
)

if (users.length === 0) {
  console.log('✅ No bcrypt passwords found. All users are already using scrypt.')
  await conn.end()
  process.exit(0)
}

console.log(`Found ${users.length} user(s) with bcrypt password:\n`)

for (const user of users) {
  const newHash = await makeScryptHash(NEW_PASSWORD)

  // Sanity-check: verify the new hash works before writing to DB
  const ok = await verifyScrypt(NEW_PASSWORD, newHash)
  if (!ok) {
    console.error(`❌  Hash self-test failed for ${user.email} – skipping`)
    continue
  }

  await conn.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id])
  console.log(`  ✅  ${user.email} (${user.role}) → password reset to "${NEW_PASSWORD}"`)
}

await conn.end()
console.log(`\nDone. Reset ${users.length} password(s) to: "${NEW_PASSWORD}"`)
