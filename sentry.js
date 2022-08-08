import Sentry from '@sentry/node'
import { 
  SENTRY_DSN
} from './config.js'

if (SENTRY_DSN !== '') Sentry.init({ dsn: SENTRY_DSN })

export function sentry_catch(fn) {
  return async function(req, res, params) {
    try {
      return await fn(req, res, params)
    } catch(e) {
      console.error(e)
      Sentry.captureException(e)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end(e.message)
    }
  }
}
