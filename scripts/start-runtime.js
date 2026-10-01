const fs = require('fs')
const path = require('path')
const http = require('http')
const net = require('net')
const { spawn } = require('child_process')
const { resolveNetworkConfig } = require('./network-config')

const root = path.resolve(__dirname, '..')
const appDir = path.join(root, 'app')
const comfyDir = path.join(root, 'comfyui', 'ComfyUI')
const runtimeDir = path.join(root, 'runtime')
const logDir = path.join(runtimeDir, 'logs')
const readyFile = path.join(runtimeDir, 'orange-ready')
const restartFile = path.join(appDir, 'RESTART_REQUIRED')
const network = resolveNetworkConfig(process.env)
const orangeHost = network.bindHost
const orangePort = network.port
const orangeUrl = network.localUrl
const comfyUrl = 'http://127.0.0.1:8188'
const verbose = /^(1|true|yes)$/i.test(String(process.env.ORANGE_VERBOSE_LOGS || ''))
const skipManagedComfy = /^(1|true|yes)$/i.test(String(process.env.ORANGE_SKIP_MANAGED_COMFYUI || ''))
const colorEnabled = !process.env.NO_COLOR && !/^(0|false|no)$/i.test(String(process.env.ORANGE_COLOR || '1'))
const eventPrefix = 'ORANGE_EVENT '

const ansi = {
  orange: '\x1b[38;5;208m',
  green: '\x1b[38;5;82m',
  cyan: '\x1b[38;5;45m',
  magenta: '\x1b[38;5;213m',
  yellow: '\x1b[38;5;220m',
  red: '\x1b[38;5;196m',
  dim: '\x1b[38;5;245m',
  reset: '\x1b[0m',
}

function paint(text, tone) {
  if (!colorEnabled) return text
  return `${ansi[tone]}${text}${ansi.reset}`
}

function valueTone(value) {
  const lowered = String(value || '').toLowerCase()
  if (lowered.includes('ready') || lowered.includes('complete')) return 'green'
  if (lowered.includes('fail') || lowered.includes('stopped') || lowered.includes('error') || lowered.includes('already in use')) return 'red'
  if (lowered.includes('starting') || lowered.includes('working') || lowered.includes('restarting')) return 'yellow'
  return 'dim'
}

function pythonPath(envDir) {
  return process.platform === 'win32'
    ? path.join(envDir, 'Scripts', 'python.exe')
    : path.join(envDir, 'bin', 'python')
}

const localOrangePython = pythonPath(path.join(appDir, 'env'))
const rootOrangePython = pythonPath(path.join(root, 'env'))
const orangePython = fs.existsSync(localOrangePython) ? localOrangePython : rootOrangePython

const localComfyPython = pythonPath(path.join(comfyDir, 'comfy-env'))
const rootComfyPython = pythonPath(path.join(root, 'comfy-env'))
const comfyPython = fs.existsSync(localComfyPython) ? localComfyPython : rootComfyPython
const managedInstalled = fs.existsSync(comfyDir) && fs.existsSync(comfyPython)
const managed = managedInstalled && !skipManagedComfy

if (!fs.existsSync(orangePython)) {
  console.error(`Orange Python environment not found: ${orangePython}`)
  process.exit(1)
}

fs.mkdirSync(logDir, { recursive: true })
const orangeLog = fs.createWriteStream(path.join(logDir, 'orange.log'), { flags: 'w' })
const comfyLog = fs.createWriteStream(path.join(logDir, 'comfyui.log'), { flags: 'w' })

const env = { ...process.env, ORANGE_INSTALL_MODE: 'pinokio' }
if (managed) {
  env.ORANGE_COMFYUI_DIR = comfyDir
  env.ORANGE_MODELS_ROOT = path.join(comfyDir, 'models')
  env.ORANGE_COMFYUI_STATE = path.join(runtimeDir, 'comfyui-state.json')
  env.ORANGE_MANAGED_COMFYUI_URL = comfyUrl
}

let comfy = null
let orange = null
let stopping = false

function clearOrangeReady() {
  try { fs.rmSync(readyFile, { force: true }) } catch (_) {}
}

function markOrangeReady() {
  try { fs.writeFileSync(readyFile, orangeUrl + '\n', 'utf8') } catch (_) {}
}

function printBanner() {
  console.log('')
  for (const line of [
    '      ▄▄▄   ▄▄▄·  ▐ ▄  ▄▄ • ▄▄▄ .',
    '▪     ▀▄ █·▐█ ▀█ •█▌▐█▐█ ▀ ▪▀▄.▀·',
    ' ▄█▀▄ ▐▀▀▄ ▄█▀▀█ ▐█▐▐▌▄█ ▀█▄▐▀▀▪▄',
    '▐█▌.▐▌▐█•█▌▐█ ▪▐▌██▐█▌▐█▄▪▐█▐█▄▄▌',
    ' ▀█▄▀▪.▀  ▀ ▀  ▀ ▀▀ █▪·▀▀▀▀  ▀▀▀ ',
  ]) console.log(paint(line, 'orange'))
  console.log('')
}

function status(name, value) {
  const labelTone = name === 'Orange' ? 'orange' : name === 'ComfyUI' ? 'cyan' : 'dim'
  const label = paint(name.padEnd(9), labelTone)
  console.log(`  ${label} ${paint(value, valueTone(value))}`)
}

function renderEvent(payloadText) {
  let event
  try {
    event = JSON.parse(payloadText)
  } catch (_) {
    console.log(`  ${paint('[Orange]', 'orange')} ${payloadText}`)
    return
  }

  const kind = String(event.kind || 'activity').toLowerCase()
  const state = String(event.state || 'info').toLowerCase()
  const message = String(event.message || '').trim()
  const label = kind === 'generation' ? 'Generate' : kind === 'llm' ? 'LLM' : 'Orange'
  const labelTone = kind === 'generation' ? 'orange' : kind === 'llm' ? 'magenta' : 'cyan'
  const stateTone = state === 'complete' ? 'green' : state === 'failed' ? 'red' : state === 'working' ? 'yellow' : 'cyan'
  console.log(`  ${paint(`[${label}]`, labelTone)} ${paint(message, stateTone)}`)
}

function shouldSurface(line) {
  if (!line) return false
  if (/FutureWarning/i.test(line)) return false
  return /(traceback|\bwarning\b|\berror\b|exception|critical|fatal|failed|failure)/i.test(line)
}

function attachOutput(child, label, logStream) {
  for (const [stream, target] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    if (!stream) continue
    let pending = ''
    stream.on('data', (chunk) => {
      logStream.write(chunk)
      pending += chunk.toString()
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith(eventPrefix)) {
          renderEvent(trimmed.slice(eventPrefix.length))
        } else if (verbose) {
          target.write(line + '\n')
        } else if (shouldSurface(trimmed)) {
          target.write(`  ${paint(`[${label}]`, 'red')} ${trimmed}\n`)
        }
      }
    })
    stream.on('end', () => {
      const trimmed = pending.trim()
      if (trimmed.startsWith(eventPrefix)) {
        renderEvent(trimmed.slice(eventPrefix.length))
      } else if (verbose && pending) {
        target.write(pending)
      } else if (!verbose && shouldSurface(trimmed)) {
        target.write(`  ${paint(`[${label}]`, 'red')} ${trimmed}\n`)
      }
      pending = ''
    })
  }
}

function spawnOrange() {
  const args = ['-m', 'uvicorn', 'app.main:app', '--host', orangeHost, '--port', String(orangePort)]
  if (!verbose) args.push('--no-access-log', '--log-level', 'warning')
  const child = spawn(orangePython, args, {
    cwd: appDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  attachOutput(child, 'Orange', orangeLog)
  return child
}

function spawnComfy() {
  const child = spawn(comfyPython, ['main.py', '--listen', '127.0.0.1', '--port', '8188'], {
    cwd: comfyDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  attachOutput(child, 'ComfyUI', comfyLog)
  return child
}

function isPortInUse(host, port, timeoutMs = 500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(value)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

function waitForHttp(url, proc, label, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    let settled = false
    const failIfExited = () => {
      if (!proc || proc.exitCode !== null) {
        settled = true
        reject(new Error(`${label} exited before it became ready${proc ? ` (exit code ${proc.exitCode})` : ''}`))
        return true
      }
      return false
    }
    const attempt = () => {
      if (settled || failIfExited()) return
      const req = http.get(url, { timeout: 1000 }, (res) => {
        res.resume()
        if (res.statusCode < 500) {
          setTimeout(() => {
            if (settled || failIfExited()) return
            settled = true
            resolve()
          }, 500)
          return
        }
        retry()
      })
      req.on('timeout', () => { req.destroy(); retry() })
      req.on('error', retry)
    }
    const retry = () => {
      if (settled) return
      if (Date.now() >= deadline) {
        settled = true
        reject(new Error(`Timed out waiting for ${label} to become ready`))
        return
      }
      setTimeout(attempt, 500)
    }
    attempt()
  })
}

function waitForOrange() {
  return waitForHttp(orangeUrl + '/', orange, 'Orange')
}

function terminate(child) {
  if (child && child.exitCode === null && !child.killed) {
    try { child.kill('SIGTERM') } catch (_) {}
  }
}

function closeLogs() {
  try { orangeLog.end() } catch (_) {}
  try { comfyLog.end() } catch (_) {}
}

function shutdown(code = 0) {
  if (stopping) return
  stopping = true
  clearOrangeReady()
  terminate(orange)
  terminate(comfy)
  setTimeout(() => {
    closeLogs()
    process.exit(code)
  }, 250)
}

async function main() {
  clearOrangeReady()
  printBanner()

  if (await isPortInUse(network.openHost, orangePort)) {
    status('Orange', `port ${orangePort} already in use`)
    console.error(`  ${paint('[Orange]', 'red')} Another Orange process or application is already using ${orangeUrl}.`)
    console.error('           Close it, choose another ORANGE_PORT, then start Orange again.')
    closeLogs()
    process.exit(1)
    return
  }

  if (managed && await isPortInUse('127.0.0.1', 8188)) {
    status('Orange', 'not started')
    status('ComfyUI', 'port 8188 already in use')
    console.error(`  ${paint('[ComfyUI]', 'red')} Another application is already using http://127.0.0.1:8188.`)
    console.error('             Close the other ComfyUI/app, then start Orange + ComfyUI again.')
    console.error('             Or choose Start Orange Only (Use Existing ComfyUI) in Pinokio.')
    closeLogs()
    process.exit(1)
    return
  }

  status('Orange', 'starting...')
  status('ComfyUI', managed ? 'starting...' : 'external / not managed')
  if (network.shareLocal || orangeHost !== '127.0.0.1') status('Network', `listening on ${orangeHost}:${orangePort}`)
  if (!verbose) status('Logs', path.relative(root, logDir) + path.sep)
  console.log('')

  if (managed) {
    comfy = spawnComfy()
    comfy.on('exit', (code) => {
      if (!stopping) {
        status('ComfyUI', `stopped unexpectedly (exit ${code})`)
        shutdown(code || 1)
      }
    })
    waitForHttp(comfyUrl + '/system_stats', comfy, 'ComfyUI')
      .then(() => status('ComfyUI', `ready   ${comfyUrl}`))
      .catch((err) => {
        if (!stopping) console.error(`  ${paint('[ComfyUI]', 'red')} ${err.message}`)
      })
  }

  orange = spawnOrange()
  orange.on('exit', async (code) => {
    if (stopping) return
    clearOrangeReady()
    if (fs.existsSync(restartFile)) {
      try { fs.rmSync(restartFile, { force: true }) } catch (_) {}
      status('Orange', 'restarting...')
      orange = spawnOrange()
      try {
        await waitForOrange()
        markOrangeReady()
        status('Orange', `ready   ${orangeUrl}`)
      } catch (err) {
        console.error(`  ${paint('[Orange]', 'red')} ${err.message}`)
        shutdown(1)
      }
      return
    }
    status('Orange', `stopped (exit ${code})`)
    shutdown(code || 0)
  })

  await waitForOrange()
  markOrangeReady()
  status('Orange', `ready   ${orangeUrl}`)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
process.on('uncaughtException', (err) => {
  console.error(err.stack || err.message || String(err))
  shutdown(1)
})
process.on('unhandledRejection', (err) => {
  console.error(err?.stack || err?.message || String(err))
  shutdown(1)
})

main().catch((err) => {
  console.error(err.stack || err.message || String(err))
  shutdown(1)
})
