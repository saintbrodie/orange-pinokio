module.exports = {
  run: [{
    method: "fs.rm",
    params: {path: "app"}
  }, {
    method: "fs.rm",
    params: {path: "env"}
  }, {
    method: "fs.rm",
    params: {path: "comfyui"}
  }, {
    method: "fs.rm",
    params: {path: "comfy-env"}
  }]
}
