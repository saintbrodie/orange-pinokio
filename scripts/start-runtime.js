const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const root = path.resolve(__dirname, '..')
const appDir = path.join(root, 'app')
const comfyDir = path.join(root, 'comfyui', 'ComfyUI')
const restartFile = path.join(appDir, 'RESTART_REQUIRED')
const orangeUrl = 'http://127.0.0.1:7070'

function pythonPath(envDir) {
  return process.platform === 'win32'
    ? path.join(envDir, 'Scripts', 'python.exe')
    : path.join(envDir, 'bin', 'python')
}

const orangePython = pythonPath(path.join(root, 'env'))
const rootComfyPython = pythonPath(path.join(root, 'comfy-env'))
const legacyComfyPython = pythonPath(path.join(comfyDir, 'comfy-env'))
const comfyPython = fs.existsSync(rootComfyPython) ? rootComfyPython : legacyComfyPython
const managed = fs.existsSync(comfyDir) && fs.existsSync(comfyPython)

if (!fs.existsSync(orangePython)) {
  console.error(`Orange Python environment not found: ${orangePython}`)
  process.exit(1)
}

const env = { ...process.env, ORANGE_INSTALL_MODE: 'pinokio' }
if (managed) {
  env.ORANGE_COMFYUI_DIR = comfyDir
  env.ORANGE_MODELS_ROOT = path.join(comfyDir, 'models')
  env.ORANGE_COMFYUI_STATE = path.join(root, 'runtime', 'comfyui-state.json')
  env.ORANGE_MANAGED_COMFYUI_URL = 'http://127.0.0.1:8188'
}

let comfy = null
let orange = null
let stopping = false

function spawnOrange() {
  return spawn(orangePython, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070'], {
    cwd: appDir,
    env,
    stdio: 'inherit',
  })
}

function waitForOrange(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (!orange || orange.exitCode !== null) {
        reject(new Error(`Orange exited before its web UI became ready${orange ? ` (exit code ${orange.exitCode})` : ''}`))
        return
      }
      const req = http.get(orangeUrl + '/', { timeout: 1000 }, (res) => {
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
        reject(new Error('Timed out waiting for Orange web UI to become ready'))
        return
      }
      setTimeout(attempt, 500)
    }
    attempt()
  })
}

function terminate(child) {
  if (child && child.exitCode === null && !child.killed) {
    try { child.kill('SIGTERM') } catch (_) {}
  }
}

function shutdown(code = 0) {
  if (stopping) return
  stopping = true
  terminate(orange)
  terminate(comfy)
  setTimeout(() => process.exit(code), 250)
}

async function main() {
  if (managed) {
    console.log(`COMFY_ENV=${path.dirname(path.dirname(comfyPython))}`)
    comfy = spawn(comfyPython, ['main.py', '--listen', '127.0.0.1', '--port', '8188'], {
      cwd: comfyDir,
      env,
      stdio: 'inherit',
    })
    comfy.on('exit', (code) => {
      if (!stopping) {
        console.error(`ComfyUI exited unexpectedly (exit code ${code})`)
        shutdown(code || 1)
      }
    })
  }

  orange = spawnOrange()
  orange.on('exit', async (code) => {
    if (stopping) return
    if (fs.existsSync(restartFile)) {
      try { fs.rmSync(restartFile, { force: true }) } catch (_) {}
      orange = spawnOrange()
      try {
        await waitForOrange()
      } catch (err) {
        console.error(err.message)
        shutdown(1)
      }
      return
    }
    shutdown(code || 0)
  })

  await waitForOrange()
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
