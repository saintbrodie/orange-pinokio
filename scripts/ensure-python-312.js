const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const target = process.argv[2] || 'all'

function pythonPath(envDir) {
  return process.platform === 'win32'
    ? path.join(envDir, 'Scripts', 'python.exe')
    : path.join(envDir, 'bin', 'python')
}

function ensure(name, envDir) {
  if (!fs.existsSync(envDir)) return
  const python = pythonPath(envDir)
  let version = ''
  try {
    version = execFileSync(python, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (_) {
    version = ''
  }
  if (version.startsWith('Python 3.12.')) {
    console.log(`${name}: ${version} is already correct.`)
    return
  }
  console.log(`${name}: rebuilding environment for Python 3.12${version ? ` (was ${version})` : ''}.`)
  fs.rmSync(envDir, { recursive: true, force: true })
}

if (target === 'all' || target === 'orange') ensure('Orange', path.join(root, 'env'))
if (target === 'all' || target === 'comfy') ensure('ComfyUI', path.join(root, 'comfy-env'))
