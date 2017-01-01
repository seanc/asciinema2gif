const jobs = require('./queue')
const exec = require('execa')
const path = require('path')
const cache = require('./cache')
const { readFile } = require('fs')

const asciinema = path.join(__dirname, '..', 'asciinema2gif', 'asciinema2gif')

jobs.count().then(c => console.log(c))

jobs.process((job, done) => {
  cache.get(job.data).then(gif => {
    if (gif === 'not-ready') {
      console.log(`processing ${job.data}`)

      const opts = job.opts
      const file = path.join(__dirname, '..', 'gifs', job.data + '.gif')
      exec(asciinema, [
        '--size', opts.size,
        '--speed', opts.speed,
        '--theme', opts.theme,
        '--output', file,
        opts.id
      ]).then(result => {
        done(null, file)
        readFile(file, 'binary', (err, data) => {
          if (err) return console.log(err)
          cache.set(job.data, data)
          console.log(`${job.data} converted to gif`)
        })
      }).catch(err => {
        done(new Error(err))
        console.log(`error while converting ${job.data}`, err)
      })
    }
  })
})

module.exports = jobs
