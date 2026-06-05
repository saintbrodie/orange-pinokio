module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app",
        message: [
          "python -u -c \"exec('''import subprocess, os\\nRF = 'RESTART_REQUIRED'\\nCMD = ['python', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070']\\nsubprocess.run(CMD)\\nwhile os.path.exists(RF):\\n    os.remove(RF)\\n    subprocess.run(CMD)''')\""
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
