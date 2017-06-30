var args = require('minimist')(process.argv.slice(2), {
  default: {
    port: 3000,
    docker_host: '10.244.27.6',
    docker_host_exec: '127.0.0.1'
  }
})
var log = require('debug-log')('register-api')
var express = require('express')
var bodyParser = require('body-parser')
var exec = require('child_process').exec

var app = express()
var nodes = []
var joinToken = '' 

app.use(bodyParser.json())

app.post('/', (req, res) => {
  nodes.push(JSON.stringify(req.body)) 
  res.send(JSON.stringify({
    token: joinToken
  }))
})

app.listen(args.port, () => {
  console.log('Listening on '+args.port)
})

// Register 
setInterval(function() {
  // Get all nodes
  exec(`docker -H tcp://${args.docker_host}:4243 run --rm --net=host -i docker:latest -H tcp://${args.docker_host_exec}:4243 node ls -q`, (err, stderr) => {
    if (err) return log(err)
    var ids = stderr.split('\n')
    console.log(ids)
    //exec(`docker run --rm --net=host -it docker:latest -H tcp://${args.docker_host_exec}:4243 node update label-add eple=kake ${id}`)
  })
//  nodes.forEach(node => {
//    
//  })
}, 3000)

// Read token
setInterval(function() {
  exec(`docker -H tcp://${args.docker_host}:4243 run --rm --net=host -i docker:latest -H tcp://${args.docker_host_exec}:4243 swarm join-token worker -q`, (err, stderr, stdout) => {
    if (err) return log(err)
    joinToken = stderr.trim()
  })
}, 3000)
