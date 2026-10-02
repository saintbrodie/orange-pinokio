module.exports = {
  run: [
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/saintbrodie/Orange app"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        message: "node scripts/ensure-python-312.js all"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        venv_python: "3.12",
        path: "app",
        message: [
          "uv pip install --python ./env -r requirements.txt"
        ]
      }
    },
    {
      when: "{{!exists('comfyui/ComfyUI')}}",
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/Comfy-Org/ComfyUI.git comfyui/ComfyUI",
          "node scripts/comfy-runtime.js pin-tested --initial"
        ]
      }
    },
    {
      when: "{{exists('comfyui/ComfyUI')}}",
      method: "shell.run",
      params: {
        message: "node scripts/comfy-runtime.js adopt"
      }
    },
    {
      when: "{{gpu === 'nvidia' && (platform === 'win32' || platform === 'linux') && Number.parseFloat(gpu_driver || '0') >= 580}}",
      method: "shell.run",
      params: {
        venv: "comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "uv pip install --python ./comfy-env --upgrade pip setuptools wheel",
          "uv pip install --python ./comfy-env torch torchvision torchaudio --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu130",
          "uv pip install --python ./comfy-env -r requirements.txt"
        ]
      }
    },
    {
      when: "{{gpu === 'nvidia' && (platform === 'win32' || platform === 'linux') && !(Number.parseFloat(gpu_driver || '0') >= 580)}}",
      method: "shell.run",
      params: {
        venv: "comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "uv pip install --python ./comfy-env --upgrade pip setuptools wheel",
          "uv pip install --python ./comfy-env torch torchvision torchaudio --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu128",
          "uv pip install --python ./comfy-env -r requirements.txt"
        ]
      }
    },
    {
      when: "{{platform === 'darwin'}}",
      method: "shell.run",
      params: {
        venv: "comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "uv pip install --python ./comfy-env --upgrade pip setuptools wheel",
          "uv pip install --python ./comfy-env torch torchvision torchaudio",
          "uv pip install --python ./comfy-env -r requirements.txt"
        ]
      }
    },
    {
      when: "{{platform !== 'darwin' && gpu !== 'nvidia'}}",
      method: "shell.run",
      params: {
        venv: "comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "uv pip install --python ./comfy-env --upgrade pip setuptools wheel",
          "{{pip.install.torch.replace(/^(?:uv )?pip3? install /, 'uv pip install --python ./comfy-env ')}}",
          "uv pip install --python ./comfy-env -r requirements.txt"
        ]
      }
    }
  ]
}
