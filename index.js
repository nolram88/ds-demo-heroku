const Deepstream = require('deepstream.io')

const server = new Deepstream()
// overwrite port for heroku
server.set('port', process.env.PORT || 6020)
server.start()
