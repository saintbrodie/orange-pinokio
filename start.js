module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app",
        message: [
          "python -u -c \"import subprocess, os; RF = 'RESTART_REQUIRED'; CMD = ['python', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070']; subprocess.run(CMD); while os.path.exists(RF): os.remove(RF); subprocess.run(CMD)\""
        ],
        on: [{
          event: "/(http:\\/\\/[^\\s]+)/",
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
