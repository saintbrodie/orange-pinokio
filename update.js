module.exports = {
  run: [
    {
      method: "shell.run",
      params: {message: "git pull --ff-only"}
    },
    {
      method: "shell.run",
      params: {path: "app", message: "git pull --ff-only"}
    },
    {
      method: "shell.run",
      params: {message: "node scripts/ensure-python-312.js orange"}
    },
    {
      method: "shell.run",
      params: {
        venv: "../env",
        venv_python: "3.12",
        path: "app",
        message: "uv pip install -r requirements.txt"
      }
    },
    {
      when: "{{exists('comfyui/ComfyUI')}}",
      method: "shell.run",
      params: {
        message: "node scripts/comfy-runtime.js adopt"
      }
    }
  ]
}
