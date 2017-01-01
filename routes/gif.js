var express = require('express');
var router = express.Router();

const cache = require('../lib/cache')
const queue = require('../lib/process')
const path = require('path')
const request = require('superagent')

const sizes = ['small', 'medium', 'big']
const themes = ['asciinema', 'tango', 'solarized-dark', 'solarized-light', 'monokai']
const re = /^[a-zA-Z]+$/

router.get('/:id', function(req, res, next) {
  const id = req.params.id || ''
  const size = req.query.size || 'medium'
  const theme = req.query.theme || 'asciinema'
  const speed = !isNaN(req.query.speed) ? parseInt(req.query.speed) : 1

  request.get(`https://asciinema.org/a/${id}`)
  .end((err, resp) => {
    if (err) return res.status(500).json({data: `there was an error fetching "${id}"`})
    if (resp.statusCode === 404) return res.status(400).json({data: `asciicast ${id} not found`})

    if (!id) return res.status(400).json({ data: 'please provide an id' })
    if (!sizes.includes(size)) return res.status(400).json({data: `size "${size}" does not exist`})
    if (!themes.includes(theme)) return res.status(400).json({data: `theme "${theme}" does not exist`})
    if (speed > 7 || speed < 1) return res.status(400).json({data: `speed must be between 1 and 7`})

    const signature = `${id}-${size}-${theme}-${speed}`

    cache.get(signature).then(gif => {
      if (gif !== 'not-ready' && re.test(gif)) {
        cache.set(signature, 'not-ready')
        queue.add(signature, { id, size, theme, speed })
        res.sendFile(path.join(__dirname, '..', 'public', 'images', 'ready.jpg'))
      } else if (!gif || gif === 'not-ready') {
        res.sendFile(path.join(__dirname, '..', 'public', 'images', 'ready.jpg'))
      } else {
        res.sendFile(path.join(__dirname, '..', 'gifs', signature + '.gif'))
      }
    })
  })
});

module.exports = router;
