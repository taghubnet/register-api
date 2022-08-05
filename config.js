import { config, string } from 'tiny-env-config'

const stringMaybe = (path) => {
  if (path === '') return ''
  return string(path)
}

export const TLS_CA = config('TLS_CA', '', stringMaybe) 
export const TLS_KEY = config('TLS_KEY', '', stringMaybe) 
export const TLS_CERT = config('TLS_CERT', '', stringMaybe)
export const HTTP_HOST = config('HTTP_HOST', '0.0.0.0')
export const HTTP_PORT = config('HTTP_PORT', '3210')
export const SENTRY_DSN = config('SENTRY_DSN', '')
export const DOCKER_SWARM_MANAGER = config('DOCKER_SWARM_MANAGER', 'docker.swarm.manager:4243')
export const WAIT_FOR_NODE_NAPTIME = config('WAIT_FOR_NODE_NAPTIME', 30)
