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

function registerNodesInSwarm() {
  // Get all registered nodes
  let options = state.cert.tlsCert ? {
    url: `https://${args.docker_swarm_manager}/swarm/nodes`,
    method: 'GET',
    cert: state.cert.tlsCert ? fs.readFileSync(state.cert.tlsCert) : '',
    key: state.cert.tlsKey ? fs.readFileSync(state.cert.tlsKey) : '',
    ca: state.cert.tlsCA ? fs.readFileSync(state.cert.tlsCA) : '',
  }: {
    url: `http://${args.docker_swarm_manager}/swarm/nodes`,
    method: 'GET',
  }
  request(options,(err, res, payload) => {
    if (err) return log(err)
    if (res.statusCode != 200) return log(err)
    let regNodes = JSON.parse(payload)
    let updates = state.nodes.map(newNode => {
      let regNodeList = regNodes.filter(rn => rn.Description.Hostname == newNode.hostname)
      if (regNodeList.length === 0) return null
      let regNode = regNodeList[0]
      return Object.assign({
        nid: regNode.ID,
        version: regNode.Version.Index,
        spec: regNode.Spec
      }, newNode)
    }).filter(rn => rn != null)
    log(`${state.nodes.length} nodes metadata`)
    log(`${updates.length} nodes ready to update`)
    log(updates)
    async.series(updates.map(update => {
      return (callback) => {
        let opt = state.cert.tlsCert ? {
          url: `https://${args.docker_swarm_manager}/swarm/nodes/${update.nid}/update?version=${update.version}`,
          method: 'POST',
          cert: state.cert.tlsCert ? fs.readFileSync(state.cert.tlsCert) : '',
          key: state.cert.tlsKey ? fs.readFileSync(state.cert.tlsKey) : '',
          ca: state.cert.tlsCA ? fs.readFileSync(state.cert.tlsCA) : '',
          json: Object.assign({}, update.spec, { Labels: update.labels }),
        }: {
          url: `http://${args.docker_swarm_manager}/swarm/nodes/${update.nid}/update?version=${update.version}`,
          method: 'POST',
          json: Object.assign({}, update.spec, { Labels: update.labels }),
        }
        request(opt, (err, res, payload) => {
          callback(err, { err: err, res: res, payload: payload, update: update })
        })
      }
    }), (err, results) => {
      results.forEach(r => {
        if (r.err) return log(`Unable to update ${r.update.nid}`, r.err)
        state.nodes = state.nodes.filter(n => n.hostname != r.update.hostname)
      })
    }) 
  })
}

function readToken() {
  let req = state.cert.tlsCert ? {
    url: `https://${args.docker_swarm_manager}/swarm`,
    method: 'GET',
    cert: state.cert.tlsCert ? fs.readFileSync(state.cert.tlsCert) : '',
    key: state.cert.tlsKey ? fs.readFileSync(state.cert.tlsKey) : '',
    ca: state.cert.tlsCA ? fs.readFileSync(state.cert.tlsCA) : '',
  }: {
    url: `http://${args.docker_swarm_manager}/swarm`,
    method: 'GET',
  }
  request(req, (err, res, payload) => {
    if (err) return console.log(err)
    if (res.statusCode != 200) return console.log("Reading token failed with the message:",  res.body)
    state.swarm = JSON.parse(payload)
  })
}

//if (args.read_token_immediately) readToken()
//setInterval(readToken, args.readTokenInterval)
//setInterval(registerNodesInSwarm, args.registerNodesInterval)
