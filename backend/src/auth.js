import jwt from 'jsonwebtoken'
import { config } from './config.js'

export function createToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, config.jwtSecret, { expiresIn: '7d' })
}

export function authenticate(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' })

  try {
    req.user = jwt.verify(token, config.jwtSecret)
    return next()
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}
