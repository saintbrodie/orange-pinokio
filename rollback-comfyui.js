module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "node scripts/comfy-runtime.js rollback"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "node scripts/ensure-python-312.js comfy"
      }
    },
    {
      when: "{{gpu === 'nvidia' && (platform === 'win32' || platform === 'linux') && Number.parseFloat(gpu_driver || '0') >= 580}}",
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "python -c \"import torch,sys; print('Torch',torch.__version__,'CUDA',torch.version.cuda); sys.exit(0 if (torch.version.cuda or '').startswith('13.0') else 1)\" || python -m pip install --upgrade --force-reinstall torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130",
          "python -m pip install -r requirements.txt"
        ]
      }
    },
    {
      when: "{{gpu === 'nvidia' && (platform === 'win32' || platform === 'linux') && !(Number.parseFloat(gpu_driver || '0') >= 580)}}",
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "python -c \"import torch,sys; print('Torch',torch.__version__,'CUDA',torch.version.cuda); sys.exit(0 if (torch.version.cuda or '').startswith('12.8') else 1)\" || python -m pip install --upgrade --force-reinstall torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128",
          "python -m pip install -r requirements.txt"
        ]
      }
    },
    {
      when: "{{platform === 'darwin'}}",
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "python -m pip install --upgrade torch torchvision torchaudio",
          "python -m pip install -r requirements.txt"
        ]
      }
    },
    {
      when: "{{platform !== 'darwin' && gpu !== 'nvidia'}}",
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: [
          "python -m ensurepip --upgrade",
          "{{pip.install.torch}}",
          "python -m pip install -r requirements.txt"
        ]
      }
    }
  ]
}
