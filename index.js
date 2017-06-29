var args = require('minimist')(process.argv.slice(2), {
  default: {
    port: 3000
  }
})
var express = require('express')
var app = express()

app.post('/', (req, res) => {
  console.log(req)
  res.send('yolo')
})

app.listen(args.port, () => {
  console.log('Listening on '+args.port)
})
