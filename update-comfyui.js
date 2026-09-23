module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "node scripts/comfy-runtime.js pin-tested"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        path: "comfyui/ComfyUI",
        message: "python -m pip install -r requirements.txt"
      }
    }
  ]
}
