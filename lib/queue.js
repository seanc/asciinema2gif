const queue = require('bull')
const jobs = queue('ascii-gif transcoding', 6379, '127.0.0.1')

module.exports = jobs
