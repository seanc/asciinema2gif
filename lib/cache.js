const RedisCache = require('simple-redis-cache')
const cache = new RedisCache({
  name: 'gif cache'
})

module.exports = cache
