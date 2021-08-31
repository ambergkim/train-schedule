const http = require('http')
const PORT = 3000

// Request controller/handler
const { line, nextMulti } = require('./controller.js')

/**
 * @description Helps us parse the raw request url and query
 * parameters
 * @param {string} requestUrl 
 * @returns {*} object.base for the basic path and object.queries
 * for the query parameters.
 */
const parseRequestUrl = requestUrl => {
  const parsed = {}

  const separators = ['?', '&', '=']

  const splitUrl = requestUrl.split(new RegExp('[' + separators.join('') + ']', 'g'))

  for (const [i, str] of splitUrl.entries()) {
    if (i === 0) {
      parsed["base"] = str
      continue
    }

    if (i % 2 === 1) {
      if (!parsed["queries"]) parsed["queries"] = {}
      parsed["queries"][str] = splitUrl[i + 1]
    }
  }

  return parsed
}

const app = http.createServer();
app.on('request', (request, response) => {
  const { base, queries } = parseRequestUrl(request.url)

  switch (base) {
    case '/line': // Creating a new line schedule
      if (request.method != "POST") {
        response.statusCode = 400
        response.end('Bad Request')
      }
      line(request, response);
      break
    case '/nextmulti': // Requesting the next time more than
    // two trains will come in at the same time.
      if (request.method != "GET") {
        response.statusCode = 400
        response.end('Bad Request')
      }
      request["queries"] = queries
      nextMulti(request, response)
    default:
      response.statusCode = 404
      response.end('Not Found')
      break
  }
})

// Enables us to control the server
const server = module.exports = {}
server.start = () => {
  return new Promise((resolve, reject) => {
    if (server.isOn) return reject(new Error('Server Error. Server already running.'))
    server.http = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`)
      server.isOn = true
      return resolve(server)
    })
  })
}
server.stop = () => {
  return new Promise((resolve, reject) => {
    if (!server.isOn) return reject(new Error('Server Error. Server already stopped.'))
    server.http.close(() => {
      server.isOn = false
      return resolve()
    })
  })
}