// Helps us discard database state that's cached in between tests.
function requireNew(module) {
  delete require.cache[require.resolve(module)]
  return require(module);
}

const test = require('tape')

test('Test that we can add a new key to the database and fetch it', async t => {
  const db = requireNew('../server/db')

  const response = db.set('line-1', 'newvalue')

  t.deepEquals(response, {})

  const fetchRes = db.fetch('line-1')

  t.equals(fetchRes, 'newvalue')
})

test('Test that we cannot add a key that is already there', async t => {
  const db = requireNew('../server/db')

  const response = db.set('line-1', 'newvalue')

  const response2 = db.set('line-1', 'newvalue')

  t.deepEquals(response2, { error: 'key already exists' })
})

test('Test that we get the right response when there is nothing to fetch', async t => {
  const db = requireNew('../server/db')

  const fetchRes = db.fetch('line-none')

  t.equals(fetchRes, undefined)
})

test('Db will return an empty list when there is nothing in the db.', async t => {
  const db = requireNew('../server/db')

  const getKeysRes = db.keys()

  t.deepEqual(getKeysRes, [])
})

test('Db will return an list of keys if there are stuff in there.', async t => {
  const db = requireNew('../server/db')
  const response = db.set('line-1', 'newvalue')

  const getKeysRes = db.keys()

  t.deepEqual(getKeysRes, ['time-multi', 'line-1'])
})