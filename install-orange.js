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
        message: "node scripts/ensure-python-312.js orange"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "../env",
        venv_python: "3.12",
        path: "app",
        message: [
          "uv pip install -r requirements.txt"
        ]
      }
    }
  ]
}
