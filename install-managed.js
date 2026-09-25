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
        venv: "../env",
        venv_python: "3.12",
        path: "app",
        message: [
          "uv pip install -r requirements.txt"
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
          "python -m pip install --upgrade pip setuptools wheel",
          "python -m pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130",
          "python -m pip install -r requirements.txt"
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
          "python -m pip install --upgrade pip setuptools wheel",
          "python -m pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu128",
          "python -m pip install -r requirements.txt"
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
          "python -m pip install --upgrade pip setuptools wheel",
          "python -m pip install torch torchvision torchaudio",
          "python -m pip install -r requirements.txt"
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
          "python -m pip install --upgrade pip setuptools wheel",
          "{{pip.install.torch}}",
          "python -m pip install -r requirements.txt"
        ]
      }
    }
  ]
}
