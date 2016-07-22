const url = require('url')
const Deepstream = require('deepstream.io')

const REDISCLOUD_URL = url.parse(process.env.REDISCLOUD_URL)
const MONGODB_URI = process.env.MONGODB_URI

const config = {
  port: process.env.PORT || 6020,
  plugins: {
    storage: {
      name: 'mongodb',
      options: {
        connectionString: MONGODB_URI,
        database: 'someDb',
        defaultTable: 'someTable',
        splitChar: '/'
      }
    },
    cache: {
      name: 'redis',
      options: {
        host: REDISCLOUD_URL.hostname,
        port: REDISCLOUD_URL.port,
        password: REDISCLOUD_URL.auth.split(':')[1]
      }
    }
  }
}

const server = new Deepstream(config)
server.start()
