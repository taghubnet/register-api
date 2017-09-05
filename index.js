var args = require('minimist')(process.argv.slice(2), {
  default: {
    host: '127.0.0.1',
    port: 3210,
    crud_host: '127.0.0.1',
    crud_port: 3333,
    readTokenInterval: 10000,
    registerNodesInterval: 10000,
    docker_swarm_manager: '127.0.0.1:4243',
    read_token_immediately: false
  }
})
var log = require('debug-log')('register-api')
var async = require('async')
var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
var exec = require('child_process').exec

var state = {
  nodes: [],
  swarm: { JoinTokens: { Worker: '', Manager: ''} }
}

const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router(state)
const middlewares = jsonServer.defaults()
server.use(middlewares)
server.use(jsonServer.bodyParser)
server.use(router)
server.listen(args.crud_port, args.crud_host, 511, () => {
  console.log('State CRUD API listening on '+args.crud_port)
})

var app = express()
app.use(bodyParser.json())
app.post('/', (req, res) => {
  state.nodes.push(Object.assign({
    created: Date.now(),
    id: state.nodes.length+1
  }, req.body)) 
  res.send(JSON.stringify({
    token: state.swarm.JoinTokens[capitalizeFirstLetter(req.body.type)] 
  }))
})
app.listen(args.port, args.host, 511, () => {
  console.log('Register API listening on '+args.port)
})

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function registerNodesInSwarm() {
  // Get all registered nodes
  request(`http://${args.docker_swarm_manager}/nodes`, (err, res, payload) => {
    if (err) return log(err)
    if (res.statusCode != 200) return log(err)
    let regNodes = JSON.parse(payload)
    let updates = state.nodes.map(newNode => {
      let regNodeList = regNodes.filter(rn => rn.Description.Hostname == newNode.hostname)
      if (regNodeList.length === 0) return null
      let regNode = regNodeList[0]
      return Object.assign({
        id: regNode.ID,
        version: regNode.Version.Index,
        spec: regNode.Spec
      }, newNode)
    }).filter(rn => rn != null)
    log(`${state.nodes.length} nodes metadata`)
    log(`${updates.length} nodes ready to update`)
    log(updates)
    async.series(updates.map(update => {
      return (callback) => {
        request({
          url: `http://${args.docker_swarm_manager}/nodes/${update.id}/update?version=${update.version}`,
          method: 'POST',
          json: Object.assign({}, update.spec, { Labels: update.labels })
        }, (err, res, payload) => {
          callback(err, { err: err, res: res, payload: payload, update: update })
        })
      }
    }), (err, results) => {
      results.forEach(r => {
        if (r.err) return log(`Unable to update ${r.update.id}`, r.err)
        nodes = state.nodes.filter(n => n.hostname != r.update.hostname)
      })
    }) 
  })
}

function readToken() {
  request(`http://${args.docker_swarm_manager}/swarm`, (err, res, payload) => {
    if (err) return log(err)
    if (res.statusCode != 200) return log(err)
    state.swarm = JSON.parse(payload)
  })
}

if (args.read_token_immediately) readToken()
setInterval(readToken, args.readTokenInterval)
setInterval(registerNodesInSwarm, args.registerNodesInterval)
