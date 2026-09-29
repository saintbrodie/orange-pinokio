module.exports = {
  daemon: true,
  run: [
    {
      when: "{{exists('comfyui/ComfyUI')}}",
      method: "shell.run",
      params: {
        message: "node scripts/comfy-runtime.js adopt"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "node scripts/start-runtime.js"
      }
    }
  ]
}
