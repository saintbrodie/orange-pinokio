module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: "git pull"
    }
  }, {
    method: "shell.run",
    params: {
      venv: "../env",
      path: "app",
      message: "python -c \"import subprocess, sys; subprocess.run(['git', 'stash']); r = subprocess.run(['git', 'pull']); subprocess.run(['git', 'stash', 'pop']); sys.exit(r.returncode)\""
    }
  }, {
    method: "shell.run",
    params: {
      venv: "../env",
      path: "app",
      message: "uv pip install -r requirements.txt"
    }
  }]
}
