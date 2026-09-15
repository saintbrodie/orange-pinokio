module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app",
        message: [
          "python -u -c \"exec('''import os, subprocess, sys, time\\nRF = 'RESTART_REQUIRED'\\nroot = os.path.abspath('..')\\ncomfy_dir = os.path.join(root, 'comfyui', 'ComfyUI')\\ncomfy_py = os.path.join(root, 'comfy-env', 'Scripts', 'python.exe') if os.name == 'nt' else os.path.join(root, 'comfy-env', 'bin', 'python')\\nmanaged = os.path.isdir(comfy_dir) and os.path.isfile(comfy_py)\\nenv = os.environ.copy()\\nenv['ORANGE_INSTALL_MODE'] = 'pinokio'\\nif managed:\\n    env['ORANGE_COMFYUI_DIR'] = comfy_dir\\n    env['ORANGE_MODELS_ROOT'] = os.path.join(comfy_dir, 'models')\\ncomfy = None\\norange = None\\ntry:\\n    if managed:\\n        comfy = subprocess.Popen([comfy_py, 'main.py', '--listen', '127.0.0.1', '--port', '8188'], cwd=comfy_dir, env=env)\\n    orange = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070'], env=env)\\n    print('ORANGE_URL=http://127.0.0.1:7070', flush=True)\\n    while True:\\n        rc = orange.poll()\\n        if rc is not None:\\n            if os.path.exists(RF):\\n                os.remove(RF)\\n                orange = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '7070'], env=env)\\n                time.sleep(1)\\n                continue\\n            sys.exit(rc)\\n        if managed and comfy.poll() is not None:\\n            sys.exit(comfy.returncode or 1)\\n        time.sleep(1)\\nfinally:\\n    for proc in (orange, comfy):\\n        if proc is not None and proc.poll() is None:\\n            proc.terminate()\\n''')\""
        ],
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
