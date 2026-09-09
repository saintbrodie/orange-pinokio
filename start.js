module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app",
        message: [
          "python -u -c \"exec('''import os, subprocess, sys, time\\nRF = 'RESTART_REQUIRED'\\nvenv_py = os.path.abspath(os.path.join('..', 'env', 'Scripts', 'python.exe')) if os.name == 'nt' else os.path.abspath(os.path.join('..', 'env', 'bin', 'python'))\\nCMD = [venv_py, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070']\\nwhile True:\\n    if os.path.exists(RF):\\n        os.remove(RF)\\n    rc = subprocess.run(CMD).returncode\\n    if os.path.exists(RF):\\n        os.remove(RF)\\n        time.sleep(2)\\n        continue\\n    sys.exit(rc)''')\""
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
