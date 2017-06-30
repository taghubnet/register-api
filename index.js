var args = require('minimist')(process.argv.slice(2), {
  default: {
    port: 3000
  }
})
var express = require('express')
var bodyParser = require('body-parser')

var app = express()
var nodes = []
var joinToken = 'abc'

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
  console.log(nodes)
}, 10000)

// Read token
setInterval(function() {
  console.log('reading token')
}, 10000)
