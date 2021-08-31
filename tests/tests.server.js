const http = require('http')
const test = require('tape')
const { spawn } = require('child_process')

const PORT = 3000

// Helps us write our requests with async/await syntax.
function httpAsync(options, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(options, response => {
      let body = ''
      response.on('data', chunk => {
        body += chunk.toString()
      })
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          body: body
        })
      })
    })

    if (body) request.write(body)

    request.end()
  })
}

// Helps us run tests against server endpoint and makes sure
// we discard server states between tests.
const startServer = async () => {
  const createProcess = (resolve, reject) => {
    child = spawn('node', ['server'])

    console.info(`Starting Server. PID: ${child.pid}`)

    child.stdout.on('data', data => {
      console.info('Getting Data', data.toString())
      if (data.includes('Server running')) resolve()
    })

    child.stderr.on('data', err => {
      console.error(`Server Error: ${err}`)
    })
  }

  return new Promise(createProcess)
}

const stopServer = async () => {
  child.kill()
  console.info('Offline process stopped')
}


test('Test that we are able to post a new train line schedule', async t => {
  await startServer()
  const newLineInfo = {
    "line": "a",
    "schedule": ["09:10AM", "11:00AM", "01:05PM"]
  }

  const data = JSON.stringify(newLineInfo)

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const response = await httpAsync(options, data)
    t.equals(response.status, 200)

    const body = await JSON.parse(response.body)
    t.equals(body.status, "Schedule saved.")
  } catch (error) {
    t.fail(error)
  }
  await stopServer()
})

test('Test that we cannot add a line name that is too long', async t => {
  await startServer()

  // NAME TOO LONG
  const newLineInfo = {
    "line": "12344567",
    "schedule": ["09:10AM", "11:00AM", "01:05PM"]
  }

  const data = JSON.stringify(newLineInfo)

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const response = await httpAsync(options, data)
    t.equals(response.status, 400)

    const body = await JSON.parse(response.body)
    t.equals(body.status, "Line name is invalid.")
  } catch (error) {
    t.fail(error)
  }
  await stopServer()
})

test('Test that we cannot add a line name with non alphanumeric characters', async t => {
  await startServer()

  // NAME TOO LONG
  const newLineInfo = {
    "line": "*23 ",
    "schedule": ["09:10AM", "11:00AM", "01:05PM"]
  }

  const data = JSON.stringify(newLineInfo)

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const response = await httpAsync(options, data)
    t.equals(response.status, 400)

    const body = await JSON.parse(response.body)
    t.equals(body.status, "Line name is invalid.")
  } catch (error) {
    t.fail(error)
  }
  await stopServer()
})

test('Test that we are able get the next time 2 or more trains are in the station', async t => {
  await startServer()

  // ADD THE FIRST LINE
  const lineAInfo = {
    "line": "a",
    "schedule": ["07:09AM", "09:10AM", "11:00AM", "01:05PM"]
  }

  const dataA = JSON.stringify(lineAInfo)

  const optionsA = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseA = await httpAsync(optionsA, dataA)
    t.equals(responseA.status, 200)

    const bodyA = await JSON.parse(responseA.body)
    t.equals(bodyA.status, "Schedule saved.")
  } catch (error) {
    t.fail(error)
  }

  // ADD A SECOND LINE
  const lineBInfo = {
    "line": "B",
    "schedule": ["07:09AM", "10:00AM", "11:00AM"]
  }

  const dataB = JSON.stringify(lineBInfo)

  const optionsB = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseB = await httpAsync(optionsB, dataB)
    t.equals(responseB.status, 200)

    const bodyB = await JSON.parse(responseB.body)
    t.equals(bodyB.status, "Schedule saved.")
  } catch (error) {
    t.fail(error)
  }

  // QUERY FOR A NEXT MATCH 2ND HALF OF MATCH LIST
  const optionsMultiA = {
    hostname: 'localhost',
    port: PORT,
    path: '/nextmulti?time=10:30AM',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseMultiA = await httpAsync(optionsMultiA)

    t.equals(responseMultiA.status, 200)

    const bodyMultiA = await JSON.parse(responseMultiA.body)
    t.equals(bodyMultiA.result, "11:00AM")
  } catch (error) {
    t.fail(error)
  }

  // QUERY FOR A NEXT MATCH 1ST HALF OF MATCH LIST
  const optionsMultiB = {
    hostname: 'localhost',
    port: PORT,
    path: '/nextmulti?time=11:30AM',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseMultiB = await httpAsync(optionsMultiB)

    t.equals(responseMultiB.status, 200)

    const bodyMultiB = await JSON.parse(responseMultiB.body)
    t.equals(bodyMultiB.result, "07:09AM")
  } catch (error) {
    t.fail(error)
  }

  // QUERY FOR A NEXT MATCH WHEN OUT OF STORAGE BOUNDS
  const optionsMultiC = {
    hostname: 'localhost',
    port: PORT,
    path: '/nextmulti?time=01:16PM',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseMultiC = await httpAsync(optionsMultiC)

    t.equals(responseMultiC.status, 200)

    const bodyMultiC = await JSON.parse(responseMultiC.body)
    t.equals(bodyMultiC.result, "07:09AM")
  } catch (error) {
    t.fail(error)
  }

  await stopServer()
})

test('Test that we do not get anything when there is no match for matching time', async t => {
  await startServer()

  // ADD THE FIRST LINE
  const lineAInfo = {
    "line": "a",
    "schedule": ["09:10AM", "11:00AM", "01:05PM"]
  }

  const dataA = JSON.stringify(lineAInfo)

  const optionsA = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseA = await httpAsync(optionsA, dataA)
    t.equals(responseA.status, 200)

    const bodyA = await JSON.parse(responseA.body)
    t.equals(bodyA.status, "Schedule saved.")
  } catch (error) {
    t.fail(error)
  }

  // QUERY FOR A NEXT MATCH 2ND HALF OF MATCH LIST
  const optionsMultiA = {
    hostname: 'localhost',
    port: PORT,
    path: '/nextmulti?time=10:30AM',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseMultiA = await httpAsync(optionsMultiA)

    t.equals(responseMultiA.status, 200)

    const bodyMultiA = await JSON.parse(responseMultiA.body)
    t.equals(bodyMultiA.result, "")
  } catch (error) {
    t.fail(error)
  }

  await stopServer()
})

test('Test that we are able get a time when the next match is the query time but for the next day.', async t => {
  await startServer()

  // ADD THE FIRST LINE
  const lineAInfo = {
    "line": "a",
    "schedule": ["09:10AM", "11:00AM", "01:05PM"]
  }

  const dataA = JSON.stringify(lineAInfo)

  const optionsA = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseA = await httpAsync(optionsA, dataA)
    t.equals(responseA.status, 200)

    const bodyA = await JSON.parse(responseA.body)
    t.equals(bodyA.status, "Schedule saved.")
  } catch (error) {
    t.fail(error)
  }

  // ADD A SECOND LINE
  const lineBInfo = {
    "line": "B",
    "schedule": ["07:09AM", "10:00AM", "11:00AM"]
  }

  const dataB = JSON.stringify(lineBInfo)

  const optionsB = {
    hostname: 'localhost',
    port: PORT,
    path: '/line',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseB = await httpAsync(optionsB, dataB)
    t.equals(responseB.status, 200)

    const bodyB = await JSON.parse(responseB.body)
    t.equals(bodyB.status, "Schedule saved.")
  } catch (error) {
    t.fail(error)
  }

  // QUERY FOR A NEXT MATCH 2ND HALF OF MATCH LIST
  const optionsMultiA = {
    hostname: 'localhost',
    port: PORT,
    path: '/nextmulti?time=11:00AM',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  try {
    const responseMultiA = await httpAsync(optionsMultiA)

    t.equals(responseMultiA.status, 200)

    const bodyMultiA = await JSON.parse(responseMultiA.body)
    t.equals(bodyMultiA.result, "11:00AM")
  } catch (error) {
    t.fail(error)
  }

  await stopServer()
})