module.exports = {
  version: "3.2",
  title: "Orange",
  description: "A simple frontend for sharing ComfyUI workflows without teaching ComfyUI.",
  icon: "icon.svg",
  menu: async (kernel, info) => {
    const installed = info.exists("env") && info.exists("app")
    const managedComfy = info.exists("comfyui/ComfyUI") && info.exists("comfy-env")
    const running = {
      chooser: info.running("install.js"),
      installManaged: info.running("install-managed.js"),
      installOrange: info.running("install-orange.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }

    if (running.chooser) {
      return [{
        default: true,
        icon: "fa-solid fa-list-check",
        text: "Preparing install choices",
        href: "install.js",
      }]
    }

    if (running.installManaged || running.installOrange) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: running.installManaged ? "install-managed.js" : "install-orange.js",
      }]
    }

    if (!installed) {
      return [{
        icon: "fa-solid fa-wand-magic-sparkles",
        text: "Install Orange + ComfyUI (Recommended)",
        href: "install-managed.js",
      }, {
        icon: "fa-solid fa-link",
        text: "Install Orange Only (Use Existing ComfyUI)",
        href: "install-orange.js",
      }]
    }

    if (running.start) {
      const local = info.local("start.js")
      const items = []
      if (local && local.url) {
        items.push({
          default: true,
          icon: "fa-solid fa-rocket",
          text: "Open Orange",
          href: local.url,
        })
      }
      if (managedComfy) {
        items.push({
          icon: "fa-solid fa-diagram-project",
          text: "Open ComfyUI (Advanced)",
          href: "http://127.0.0.1:8188",
        })
      }
      items.push({
        icon: "fa-solid fa-terminal",
        text: "Terminal",
        href: "start.js",
      })
      return items
    }

    if (running.update) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Updating", href: "update.js"}]
    }

    if (running.reset) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Factory Resetting", href: "reset.js"}]
    }

    return [{
      default: true,
      icon: "fa-solid fa-power-off",
      text: managedComfy ? "Start Orange + ComfyUI" : "Start Orange",
      href: "start.js",
    }, {
      icon: "fa-solid fa-arrows-rotate",
      text: "Update",
      href: "update.js",
    }, {
      icon: "fa-solid fa-screwdriver-wrench",
      text: "Repair Dependencies",
      href: managedComfy ? "install-managed.js" : "install-orange.js",
    }, {
      icon: "fa-solid fa-triangle-exclamation",
      text: "Factory Reset (Deletes Local Data)",
      href: "reset.js",
    }]
  }
}
