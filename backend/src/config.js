import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { timingSafeEqual } from 'node:crypto'

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || '',
  adminSetupToken: process.env.ADMIN_SETUP_TOKEN || '',
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || (process.env.DB_HOST?.includes('tidbcloud.com') ? 4000 : 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
    sslCa: process.env.DB_SSL_CA?.replace(/\\n/g, '\n'),
  },
}

export function getConfigurationIssues() {
  const missing = required.filter((key) => !process.env[key])
  const issues = missing.length ? [`Missing environment variables: ${missing.join(', ')}`] : []
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET must be at least 32 characters long.')
  }
  if (Boolean(config.adminEmail) !== Boolean(config.adminSetupToken)) {
    issues.push('Set both ADMIN_EMAIL and ADMIN_SETUP_TOKEN to enable teacher quiz management.')
  }
  if (config.adminSetupToken && config.adminSetupToken.length < 24) {
    issues.push('ADMIN_SETUP_TOKEN must be at least 24 characters long.')
  }
  return issues
}

export function isValidAdminSetupToken(value) {
  if (typeof value !== 'string' || !config.adminSetupToken) return false
  const provided = Buffer.from(value)
  const expected = Buffer.from(config.adminSetupToken)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export function requireConfiguration() {
  const issues = getConfigurationIssues()
  if (issues.length) {
    const error = new Error(issues.join(' '))
    error.code = 'APP_CONFIG_MISSING'
    throw error
  }
}
