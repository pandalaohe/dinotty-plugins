const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const esbuild = require('esbuild')

const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-browser-ui-multi-mount-'))
const bundlePath = path.join(bundleDir, 'ui.cjs')
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../src/ui.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: bundlePath,
  logLevel: 'silent',
})
const { activate } = require(bundlePath)

test.after(() => fs.rmSync(bundleDir, { recursive: true, force: true }))

function h(tag, props, ...children) {
  return { tag, props: props || {}, children }
}

function flatten(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) flatten(item, output)
  } else if (value !== null && value !== undefined && value !== false) {
    output.push(value)
    if (typeof value === 'object' && 'children' in value) flatten(value.children, output)
  }
  return output
}

function textOf(value) {
  return flatten(value).filter(item => typeof item === 'string').join('')
}

function deferred() {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

async function flush(rounds = 8) {
  for (let index = 0; index < rounds; index++) await new Promise(resolve => setImmediate(resolve))
}

function session(id, title, rootPath = '/work') {
  return {
    id,
    agent: 'claude-code',
    rootPath,
    attributionKey: rootPath.replaceAll('/', '-'),
    title,
    createdAt: '2026-07-10T00:00:00.000Z',
    lastActiveAt: '2026-07-10T01:00:00.000Z',
    messageCount: 1,
    partition: 'active',
    health: 'ok',
    timestampSource: 'event',
    sizeBytes: 1,
  }
}

const capabilities = {
  archive: true,
  rename: false,
  delete: true,
  deleteRequiresArchived: true,
  nativeIndex: false,
  tokenStats: false,
  originFilter: false,
}

async function mountTwoPanes() {
  const previousDocument = global.document
  const previousMutationObserver = global.MutationObserver
  const previousRequestAnimationFrame = global.requestAnimationFrame
  const previousCancelAnimationFrame = global.cancelAnimationFrame
  const previousNavigator = Object.getOwnPropertyDescriptor(global, 'navigator')
  const mounted = []
  const unmounted = []
  const calls = []
  const notifications = []
  const storage = new Map([
    ['locale', 'en'],
    ['activeAgent', 'claude-code'],
  ])
  const sessionsByAgent = {
    'claude-code': [
      session('11111111-1111-1111-1111-111111111111', 'Alpha'),
      session('22222222-2222-2222-2222-222222222222', 'Beta'),
      session('33333333-3333-3333-3333-333333333333', 'Gamma'),
    ],
    codex: [
      { ...session('44444444-4444-4444-4444-444444444444', 'Delta', '/codex'), agent: 'codex' },
    ],
  }
  let holdNextArchive = false
  let archiveGate = null

  global.document = {
    documentElement: { lang: 'en-US' },
    body: { classList: { add() {}, remove() {} } },
    getElementById() { return null },
    addEventListener() {},
    removeEventListener() {},
  }
  global.MutationObserver = class { observe() {} disconnect() {} }
  global.requestAnimationFrame = callback => setTimeout(callback, 0)
  global.cancelAnimationFrame = handle => clearTimeout(handle)
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: { clipboard: { writeText: async () => {} } },
  })

  const ctx = {
    h,
    ref: value => ({ value }),
    computed: getter => ({ get value() { return getter() } }),
    watch() {},
    onMounted: callback => mounted.push(callback),
    onUnmounted: callback => unmounted.push(callback),
    open() {},
    commands: { register: () => ({ dispose() {} }) },
    storage: {
      get: async key => storage.get(key),
      set: async (key, value) => { storage.set(key, value) },
    },
    exec: {
      run: async args => {
        calls.push([...args])
        if (args[0] === 'agents') {
          return {
            code: 0,
            stdout: JSON.stringify([
              { id: 'claude-code', available: true, capabilities, resume: { argv: ['claude', '--resume'] } },
              { id: 'codex', available: true, capabilities, resume: { argv: ['codex', 'resume'] } },
            ]),
            stderr: '',
          }
        }
        if (args[0] === 'build-index') {
          const agent = args[args.indexOf('--agent') + 1]
          return { code: 0, stdout: JSON.stringify(sessionsByAgent[agent] || []), stderr: '' }
        }
        if (args[0] === 'list-pins') {
          return { code: 0, stdout: JSON.stringify({ pins: [] }), stderr: '' }
        }
        if (args[0] === 'read-session') {
          return {
            code: 0,
            stdout: JSON.stringify([{
              uuid: `message-${args[2]}`,
              role: 'user',
              content: `transcript-${args[2]}`,
              timestamp: '2026-07-10T01:00:00.000Z',
            }]),
            stderr: '',
          }
        }
        if (args[0] === 'archive') {
          if (holdNextArchive) {
            holdNextArchive = false
            return archiveGate.promise
          }
          return { code: 0, stdout: JSON.stringify({ outcome: 'success', cacheRefreshed: true }), stderr: '' }
        }
        return { code: 0, stdout: JSON.stringify({ outcome: 'success', cacheRefreshed: true }), stderr: '' }
      },
    },
    ui: {
      notify: (...args) => { notifications.push(args) },
      confirm: async () => true,
    },
    terminal: { activePaneId: () => null },
  }

  const plugin = activate(ctx)
  function setupPane(props) {
    const mountedIndex = mounted.length
    const unmountedIndex = unmounted.length
    const render = plugin.component.setup(props)
    const mountCallbacks = mounted.slice(mountedIndex)
    const unmountCallbacks = unmounted.slice(unmountedIndex)
    let active = false
    return {
      render,
      mount() {
        if (active) return
        active = true
        for (const callback of mountCallbacks) callback()
      },
      unmount() {
        if (!active) return
        active = false
        for (const callback of unmountCallbacks) callback()
      },
    }
  }

  const paneA = setupPane({ paneId: 'pane-a', workspaceId: 'ws-a', isVisible: true, isFocused: true })
  const paneB = setupPane({ paneId: 'pane-b', workspaceId: 'ws-b', isVisible: true, isFocused: true })
  paneA.mount()
  paneB.mount()
  await flush()

  return {
    paneA,
    paneB,
    calls,
    notifications,
    holdArchive() {
      archiveGate = deferred()
      holdNextArchive = true
      return archiveGate
    },
    cleanup() {
      paneA.unmount()
      paneB.unmount()
      plugin.dispose()
      global.document = previousDocument
      global.MutationObserver = previousMutationObserver
      global.requestAnimationFrame = previousRequestAnimationFrame
      global.cancelAnimationFrame = previousCancelAnimationFrame
      if (previousNavigator) Object.defineProperty(global, 'navigator', previousNavigator)
      else delete global.navigator
    },
  }
}

function findSessionCard(render, title) {
  return flatten(render()).find(node => node?.tag === 'article' && textOf(node).includes(title))
}

function isSelectedSessionCard(card) {
  return Array.isArray(card?.props?.class) && card.props.class.includes('ccm-browser-session-card-selected')
}

function archiveSession(render, title) {
  const card = findSessionCard(render, title)
  const button = flatten(card).find(node => node?.tag === 'button' && node.props?.title === 'Archive session')
  assert.ok(button, `${title} is missing its archive action`)
  button.props.onClick({ stopPropagation() {} })
}

test('two panes keep selection and transcripts independent while sharing initialization', async () => {
  const harness = await mountTwoPanes()
  try {
    assert.equal(harness.calls.filter(args => args[0] === 'agents').length, 1)
    assert.equal(harness.calls.filter(args => args[0] === 'build-index').length, 1)

    const searchA = flatten(harness.paneA.render()).find(
      node => node?.tag === 'input' && node.props?.id?.startsWith('session-browser-search-input'),
    )
    const searchB = flatten(harness.paneB.render()).find(
      node => node?.tag === 'input' && node.props?.id?.startsWith('session-browser-search-input'),
    )
    assert.ok(searchA)
    assert.ok(searchB)
    assert.notEqual(searchA.props.id, searchB.props.id)

    findSessionCard(harness.paneA.render, 'Alpha').props.onClick()
    findSessionCard(harness.paneB.render, 'Beta').props.onClick()
    await flush()

    const alphaTranscript = 'transcript-11111111-1111-1111-1111-111111111111'
    const betaTranscript = 'transcript-22222222-2222-2222-2222-222222222222'
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneA.render, 'Alpha')), true)
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneA.render, 'Beta')), false)
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneB.render, 'Alpha')), false)
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneB.render, 'Beta')), true)
    assert.match(textOf(harness.paneA.render()), new RegExp(alphaTranscript))
    assert.doesNotMatch(textOf(harness.paneA.render()), new RegExp(betaTranscript))
    assert.match(textOf(harness.paneB.render()), new RegExp(betaTranscript))
    assert.doesNotMatch(textOf(harness.paneB.render()), new RegExp(alphaTranscript))

    findSessionCard(harness.paneA.render, 'Gamma').props.onClick()
    await flush()

    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneA.render, 'Alpha')), false)
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneA.render, 'Gamma')), true)
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneB.render, 'Beta')), true)
    assert.equal(isSelectedSessionCard(findSessionCard(harness.paneB.render, 'Gamma')), false)
    assert.match(textOf(harness.paneA.render()), /transcript-33333333-3333-3333-3333-333333333333/)
    assert.doesNotMatch(textOf(harness.paneA.render()), new RegExp(alphaTranscript))
    assert.match(textOf(harness.paneB.render()), new RegExp(betaTranscript))
    assert.doesNotMatch(textOf(harness.paneB.render()), /transcript-33333333-3333-3333-3333-333333333333/)
  } finally {
    harness.cleanup()
  }
})

test('destructive mutations are serialized across panes', async () => {
  const harness = await mountTwoPanes()
  try {
    findSessionCard(harness.paneA.render, 'Alpha').props.onClick()
    findSessionCard(harness.paneB.render, 'Beta').props.onClick()
    await flush()

    const archiveGate = harness.holdArchive()
    archiveSession(harness.paneB.render, 'Beta')
    await flush(2)
    assert.equal(harness.calls.filter(args => args[0] === 'archive').length, 1)

    archiveSession(harness.paneA.render, 'Alpha')
    await flush(2)

    assert.equal(harness.calls.filter(args => args[0] === 'archive').length, 1)
    assert.ok(harness.notifications.some(
      ([message, level]) => message === 'Another session operation is already running.' && level === 'warn',
    ))

    archiveGate.resolve({
      code: 0,
      stdout: JSON.stringify({ outcome: 'success', cacheRefreshed: true }),
      stderr: '',
    })
    await flush()
  } finally {
    harness.cleanup()
  }
})

test('unmounting one pane leaves the other working and receiving index updates', async () => {
  const harness = await mountTwoPanes()
  try {
    harness.paneA.unmount()

    const agentSwitcher = flatten(harness.paneB.render()).find(
      node => node?.tag === 'select' && node.props?.['aria-label'] === 'Session agent',
    )
    assert.ok(agentSwitcher)
    agentSwitcher.props.onChange({ target: { value: 'codex' } })
    await flush(12)

    assert.equal(harness.calls.filter(args => args[0] === 'agents').length, 1)
    assert.equal(harness.calls.filter(args => args[0] === 'build-index').length, 2)
    assert.match(textOf(harness.paneB.render()), /Delta/)
    assert.doesNotMatch(textOf(harness.paneB.render()), /Alpha|Beta|Gamma/)

    findSessionCard(harness.paneB.render, 'Delta').props.onClick()
    await flush()
    assert.match(textOf(harness.paneB.render()), /transcript-44444444-4444-4444-4444-444444444444/)
  } finally {
    harness.cleanup()
  }
})
