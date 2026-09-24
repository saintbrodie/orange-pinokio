module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "node scripts/comfy-runtime.js latest"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "node scripts/ensure-python-312.js comfy"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        venv_python: "3.12",
        path: "comfyui/ComfyUI",
        message: "python -m pip install -r requirements.txt"
      }
    }
  ]
}
