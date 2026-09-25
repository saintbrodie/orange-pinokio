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
        message: "node scripts/start-runtime.js",
        on: [{
          event: "/ORANGE_URL=(http:\\/\\/[^\\s]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
