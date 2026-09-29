const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const root = path.resolve(__dirname, '..')
const appDir = path.join(root, 'app')
const comfyDir = path.join(root, 'comfyui', 'ComfyUI')
const runtimeDir = path.join(root, 'runtime')
const logDir = path.join(runtimeDir, 'logs')
const restartFile = path.join(appDir, 'RESTART_REQUIRED')
const orangeUrl = 'http://127.0.0.1:7070'
const comfyUrl = 'http://127.0.0.1:8188'
const verbose = /^(1|true|yes)$/i.test(String(process.env.ORANGE_VERBOSE_LOGS || ''))

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
const managed = fs.existsSync(comfyDir) && fs.existsSync(comfyPython)

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

function printBanner() {
  console.log('')
  console.log('      ▄▄▄   ▄▄▄·  ▐ ▄  ▄▄ • ▄▄▄ .')
  console.log('▪     ▀▄ █·▐█ ▀█ •█▌▐█▐█ ▀ ▪▀▄.▀·')
  console.log(' ▄█▀▄ ▐▀▀▄ ▄█▀▀█ ▐█▐▐▌▄█ ▀█▄▐▀▀▪▄')
  console.log('▐█▌.▐▌▐█•█▌▐█ ▪▐▌██▐█▌▐█▄▪▐█▐█▄▄▌')
  console.log(' ▀█▄▀▪.▀  ▀ ▀  ▀ ▀▀ █▪·▀▀▀▀  ▀▀▀ ')
  console.log('')
}

function status(name, value) {
  console.log(`  ${name.padEnd(9)} ${value}`)
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
      if (verbose) {
        target.write(chunk)
        return
      }
      pending += chunk.toString()
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (shouldSurface(trimmed)) target.write(`  [${label}] ${trimmed}\n`)
      }
    })
    stream.on('end', () => {
      const trimmed = pending.trim()
      if (!verbose && shouldSurface(trimmed)) target.write(`  [${label}] ${trimmed}\n`)
      pending = ''
    })
  }
}

function spawnOrange() {
  const args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070']
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

function waitForHttp(url, proc, label, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (!proc || proc.exitCode !== null) {
        reject(new Error(`${label} exited before it became ready${proc ? ` (exit code ${proc.exitCode})` : ''}`))
        return
      }
      const req = http.get(url, { timeout: 1000 }, (res) => {
        res.resume()
        if (res.statusCode < 500) {
          resolve()
          return
        }
        retry()
      })
      req.on('timeout', () => { req.destroy(); retry() })
      req.on('error', retry)
    }
    const retry = () => {
      if (Date.now() >= deadline) {
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
  terminate(orange)
  terminate(comfy)
  setTimeout(() => {
    closeLogs()
    process.exit(code)
  }, 250)
}

async function main() {
  printBanner()
  status('Orange', 'starting...')
  status('ComfyUI', managed ? 'starting...' : 'external / not managed')
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
        if (!stopping) console.error(`  [ComfyUI] ${err.message}`)
      })
  }

  orange = spawnOrange()
  orange.on('exit', async (code) => {
    if (stopping) return
    if (fs.existsSync(restartFile)) {
      try { fs.rmSync(restartFile, { force: true }) } catch (_) {}
      status('Orange', 'restarting...')
      orange = spawnOrange()
      try {
        await waitForOrange()
        status('Orange', `ready   ${orangeUrl}`)
      } catch (err) {
        console.error(`  [Orange] ${err.message}`)
        shutdown(1)
      }
      return
    }
    status('Orange', `stopped (exit ${code})`)
    shutdown(code || 0)
  })

  await waitForOrange()
  status('Orange', `ready   ${orangeUrl}`)
  console.log('')
  console.log(`ORANGE_URL=${orangeUrl}`)
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
