const assert = require('node:assert/strict')
const { test } = require('node:test')

const files = ['install-managed.js', 'install-orange.js', 'update.js',
  'update-comfyui.js', 'update-comfyui-latest.js', 'rollback-comfyui.js']

function render(text, context) {
  return text.replace(/\{\{([\s\S]*?)\}\}/g, (_, expression) =>
    String(Function(...Object.keys(context), `return (${expression})`)(...Object.values(context))))
}

function packageSteps(file, context) {
  return require(`../${file}`).run.filter(step => step.params.venv &&
    (!step.when || render(step.when, context) === 'true'))
}

const platforms = [
  { platform: 'win32', gpu: 'nvidia', gpu_driver: '580.10', cuda: 'cu130' },
  { platform: 'linux', gpu: 'nvidia', gpu_driver: '579.99', cuda: 'cu128' },
  { platform: 'win32', gpu: 'nvidia', gpu_driver: '', cuda: 'cu128' },
  { platform: 'linux', gpu: 'nvidia', gpu_driver: '580', cuda: 'cu130' },
  { platform: 'darwin', gpu: 'apple', gpu_driver: '' },
  { platform: 'win32', gpu: 'amd', gpu_driver: '' },
  { platform: 'linux', gpu: 'amd', gpu_driver: '' },
  { platform: 'linux', gpu: 'cpu', gpu_driver: '' },
]

for (const file of files) {
  test(`${file}: selected package commands target their path-local environment`, () => {
    for (const platform of platforms) {
      const context = { ...platform, pip: { install: { torch: 'pip3 install torch torchvision torchaudio' } } }
      const steps = packageSteps(file, context)
      assert.equal(steps.length, file === 'install-managed.js' ? 2 : 1)
      for (const step of steps) {
        const { venv, venv_python, path: cwd, message } = step.params
        assert.equal(venv_python, '3.12')
        assert.equal(cwd, venv === 'env' ? 'app' : 'comfyui/ComfyUI')
        for (const command of [message].flat().map(text => render(text, context))) {
          if (!command.includes('pip install')) {
            assert.equal(command, 'python -m ensurepip --upgrade')
            continue
          }
          assert.match(command, new RegExp(`(?:^| \\|\\| )uv pip install --python \\./${venv} `))
          assert.equal((command.match(/--python /g) || []).length, 1)
          assert.ok(!command.includes('--system'))
          if (command.includes('torch torchvision torchaudio') && platform.cuda) {
            const url = `https://download.pytorch.org/whl/${platform.cuda}`
            if (file === 'install-managed.js') {
              assert.ok(command.endsWith(`--index-strategy unsafe-best-match --extra-index-url ${url}`))
              assert.ok(!command.includes('--upgrade'))
            } else {
              assert.ok(command.endsWith(`--upgrade --force-reinstall torch torchvision torchaudio --index-url ${url}`))
              assert.ok(command.startsWith('python -c '))
              const cudaVersion = platform.cuda === 'cu130' ? '13.0' : '12.8'
              assert.ok(command.includes(`startswith('${cudaVersion}')`))
            }
          }
        }
      }
    }
  })
}

test('Pinokio fallback keeps platform-specific Torch packages and index flags', () => {
  const suffixes = [
    'torch torchvision torchaudio',
    'torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm5.6',
    'torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu',
  ]
  for (const file of files.filter(file => file.includes('comfyui') || file === 'install-managed.js')) {
    for (const suffix of suffixes) {
      for (const prefix of ['pip3 install ', 'pip install ', 'uv pip install ']) {
        const context = { platform: 'linux', gpu: 'amd', gpu_driver: '', pip: { install: { torch: prefix + suffix } } }
        const step = packageSteps(file, context).find(step => step.params.venv === 'comfy-env')
        const template = step.params.message.find(command => command.includes('pip.install.torch'))
        assert.equal(render(template, context), `uv pip install --python ./comfy-env ${suffix}`)
      }
    }
  }
})

test('Repair Dependencies reuses the migrated install paths', async () => {
  const launcher = require('../pinokio.js')
  for (const managed of [false, true]) {
    const paths = new Set(['app', 'app/env', ...(managed ? ['comfyui/ComfyUI', 'comfyui/ComfyUI/comfy-env'] : [])])
    const items = await launcher.menu({}, { exists: p => paths.has(p), running: () => false })
    assert.equal(items.find(item => item.text === 'Repair Dependencies').href,
      managed ? 'install-managed.js' : 'install-orange.js')
  }
})
