const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const comfyDir = path.join(root, 'comfyui', 'ComfyUI')
const manifestPath = path.join(root, 'app', 'runtime', 'managed-runtime.json')
const statePath = path.join(root, 'runtime', 'comfyui-state.json')

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: comfyDir,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function readJson(file, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (_) {
    return fallback
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, file)
}

function manifest() {
  const data = readJson(manifestPath)
  const comfy = data && data.comfyui
  if (!comfy || !comfy.testedCommit) {
    throw new Error(`Orange managed runtime manifest is missing testedCommit: ${manifestPath}`)
  }
  return comfy
}

function currentCommit() {
  if (!fs.existsSync(comfyDir)) return null
  try {
    return git(['rev-parse', 'HEAD'])
  } catch (_) {
    return null
  }
}

function markState({ target, previous, channel, initial = false }) {
  const existing = readJson(statePath)
  const next = {
    schemaVersion: 1,
    currentCommit: target,
    previousCommit: initial ? null : (previous || existing.previousCommit || null),
    targetCommit: target,
    channel,
    validation: 'pending',
    validationError: null,
    tools: [],
    updatedAt: new Date().toISOString(),
  }
  writeJson(statePath, next)
  return next
}

function fetchOrigin() {
  console.log('Fetching ComfyUI revisions...')
  git(['fetch', '--prune', 'origin'], { inherit: true })
}

function checkout(target) {
  git(['checkout', '--detach', target], { inherit: true })
}

function setTested({ initial = false } = {}) {
  const tested = manifest().testedCommit
  const before = currentCommit()
  if (!before) throw new Error('Managed ComfyUI repository is not installed.')

  if (before !== tested) {
    fetchOrigin()
    checkout(tested)
  }
  markState({ target: tested, previous: before !== tested ? before : null, channel: 'tested', initial })
  console.log(`COMFY_RUNTIME=${tested}`)
  console.log(before === tested ? 'ComfyUI is already on the Orange-tested revision.' : 'ComfyUI moved to the Orange-tested revision.')
}

function setLatest() {
  const before = currentCommit()
  if (!before) throw new Error('Managed ComfyUI repository is not installed.')

  fetchOrigin()
  const remoteHead = git(['ls-remote', 'origin', 'HEAD']).split(/\s+/)[0]
  if (!remoteHead) throw new Error('Could not resolve upstream ComfyUI HEAD.')
  if (before !== remoteHead) checkout(remoteHead)
  markState({ target: remoteHead, previous: before !== remoteHead ? before : null, channel: 'latest' })
  console.log(`COMFY_RUNTIME=${remoteHead}`)
  console.log(before === remoteHead ? 'ComfyUI is already on upstream latest.' : 'ComfyUI moved to upstream latest (untested by Orange).')
}

function rollback() {
  const state = readJson(statePath)
  const target = state.previousCommit
  const before = currentCommit()
  if (!before) throw new Error('Managed ComfyUI repository is not installed.')
  if (!target) throw new Error('No previous managed ComfyUI revision is recorded for rollback.')

  try {
    checkout(target)
  } catch (_) {
    fetchOrigin()
    checkout(target)
  }

  const tested = manifest().testedCommit
  markState({
    target,
    previous: before !== target ? before : null,
    channel: target === tested ? 'tested' : 'rollback',
  })
  console.log(`COMFY_RUNTIME=${target}`)
  console.log(`Rolled ComfyUI back from ${before.slice(0, 8)} to ${target.slice(0, 8)}.`)
}

function status() {
  const comfy = manifest()
  const state = readJson(statePath)
  const current = currentCommit()
  console.log(JSON.stringify({
    currentCommit: current,
    testedCommit: comfy.testedCommit,
    testedDate: comfy.testedDate || null,
    matchesTested: Boolean(current && current === comfy.testedCommit),
    previousCommit: state.previousCommit || null,
    channel: state.channel || (current === comfy.testedCommit ? 'tested' : 'custom'),
    validation: state.validation || null,
  }, null, 2))
}

const action = process.argv[2]
try {
  if (action === 'pin-tested') {
    setTested({ initial: process.argv.includes('--initial') })
  } else if (action === 'latest') {
    setLatest()
  } else if (action === 'rollback') {
    rollback()
  } else if (action === 'status') {
    status()
  } else {
    throw new Error('Usage: node scripts/comfy-runtime.js <pin-tested|latest|rollback|status> [--initial]')
  }
} catch (error) {
  console.error(`ComfyUI runtime operation failed: ${error.message}`)
  process.exit(1)
}
