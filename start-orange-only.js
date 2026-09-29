module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        path: ".",
        env: {
          ORANGE_SKIP_MANAGED_COMFYUI: "1"
        },
        message: "node scripts/start-runtime.js"
      }
    }
  ]
}
