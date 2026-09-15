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
      params: {
        venv: "../env",
        path: "app",
        message: "uv pip install -r requirements.txt"
      }
    },
    {
      when: "{{exists('comfyui/ComfyUI')}}",
      method: "shell.run",
      params: {path: "comfyui/ComfyUI", message: "git pull --ff-only"}
    },
    {
      when: "{{exists('comfyui/ComfyUI')}}",
      method: "shell.run",
      params: {
        venv: "../../comfy-env",
        path: "comfyui/ComfyUI",
        message: "pip install -r requirements.txt"
      }
    }
  ]
}
