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
        venv: "../env",
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
          "git clone https://github.com/comfyanonymous/ComfyUI.git comfyui/ComfyUI"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "comfy-env",
        path: "comfyui/ComfyUI",
        message: [
          "{{pip.install.torch}}",
          "pip install -r requirements.txt"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app",
        message: [
          "python scripts/download_models.py --pack z-image-turbo --models-root ../comfyui/ComfyUI/models"
        ]
      }
    }
  ]
}
