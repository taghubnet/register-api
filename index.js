var args = require('minimist')(process.argv.slice(2), {
  default: {
    port: 3000
  }
})
var express = require('express')
var bodyParser = require('body-parser')
var app = express()

app.use(bodyParser.json())

app.post('/', (req, res) => {
  console.log(req.body)
  res.send(JSON.stringify(req.body))
})

app.listen(args.port, () => {
  console.log('Listening on '+args.port)
})
