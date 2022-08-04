import fs from 'fs' 
import path from 'path'
import http from 'http'
import debug_log from 'debug-log'
import { router, method } from 'tiny-http-router'
import {
  HTTP_HOST,
  HTTP_PORT,
} from './config.js'
import { register_node_in_swarm } from './api.js'

const log = debug_log('register-api')

// TODO: SENTRY

const server = http.createServer(router({
  '/': method('POST', register_node_in_swarm)
}, (req, res, { send }) => {
  send(200, 'default')
})).listen(HTTP_PORT, HTTP_HOST, () => {
  console.log(`http server listening on ${HTTP_HOST}:${HTTP_PORT}`)
})
