import fs from 'fs' 
import path from 'path'
import http from 'http'
import { router, method } from 'tiny-http-router'
import {
  HTTP_HOST,
  HTTP_PORT,
} from './config.js'
import { register_node_in_swarm } from './api.js'
import { sentry_catch } from './sentry.js'

const server = http.createServer(router({
  '/': method('POST', sentry_catch(register_node_in_swarm))
}, (req, res, { send }) => {
  send(200, 'default')
})).listen(HTTP_PORT, HTTP_HOST, () => {
  console.log(`http server listening on ${HTTP_HOST}:${HTTP_PORT}`)
})
