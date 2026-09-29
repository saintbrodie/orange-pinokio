module.exports = {
  version: "3.5",
  title: "Orange",
  description: "A simple frontend for sharing ComfyUI workflows without teaching ComfyUI.",
  icon: "icon.svg",
  menu: async (kernel, info) => {
    const orangeLocalEnv = info.exists("app/env")
    const orangeRootEnv = info.exists("env")
    const installed = info.exists("app") && (orangeLocalEnv || orangeRootEnv)
    const managedSource = info.exists("comfyui/ComfyUI")
    const managedLocalComfy = info.exists("comfyui/ComfyUI/comfy-env")
    const managedRootComfy = info.exists("comfy-env")
    const managedComfy = managedSource && (managedLocalComfy || managedRootComfy)
    const managedIncomplete = installed && managedSource && !managedComfy
    const rollbackAvailable = info.exists("runtime/comfyui-rollback-available")
    const orangeReady = info.exists("runtime/orange-ready")
    const running = {
      chooser: info.running("install.js"),
      installManaged: info.running("install-managed.js"),
      installOrange: info.running("install-orange.js"),
      start: info.running("start.js"),
      startOrangeOnly: info.running("start-orange-only.js"),
      update: info.running("update.js"),
      updateComfy: info.running("update-comfyui.js"),
      updateComfyLatest: info.running("update-comfyui-latest.js"),
      rollbackComfy: info.running("rollback-comfyui.js"),
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

    if (managedIncomplete) {
      return [{
        icon: "fa-solid fa-screwdriver-wrench",
        text: "Finish Orange + ComfyUI Install",
        href: "install-managed.js",
      }, {
        icon: "fa-solid fa-play",
        text: "Start Orange Only",
        href: "start-orange-only.js",
      }, {
        icon: "fa-solid fa-arrows-rotate",
        text: "Update Orange",
        href: "update.js",
      }, {
        icon: "fa-solid fa-triangle-exclamation",
        text: "Factory Reset (Deletes Local Data)",
        href: "reset.js",
      }]
    }

    if (running.start || running.startOrangeOnly) {
      const activeStart = running.startOrangeOnly ? "start-orange-only.js" : "start.js"
      const items = []
      if (orangeReady) {
        items.push({
          default: true,
          icon: "fa-solid fa-rocket",
          text: "Open Orange",
          href: "http://127.0.0.1:7070",
        })
      } else {
        items.push({
          default: true,
          icon: "fa-solid fa-spinner",
          text: running.startOrangeOnly ? "Starting Orange Only" : "Starting Orange",
          href: activeStart,
        })
      }
      if (managedComfy && running.start) {
        items.push({
          icon: "fa-solid fa-diagram-project",
          text: "Open ComfyUI (Advanced)",
          href: "http://127.0.0.1:8188",
        })
      }
      if (orangeReady) {
        items.push({
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: activeStart,
        })
      }
      return items
    }

    if (running.update) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Updating Orange", href: "update.js"}]
    }
    if (running.updateComfy) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Updating ComfyUI to Orange-tested version", href: "update-comfyui.js"}]
    }
    if (running.updateComfyLatest) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Updating ComfyUI to upstream latest", href: "update-comfyui-latest.js"}]
    }
    if (running.rollbackComfy) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Rolling back ComfyUI", href: "rollback-comfyui.js"}]
    }
    if (running.reset) {
      return [{default: true, icon: "fa-solid fa-terminal", text: "Factory Resetting", href: "reset.js"}]
    }

    const items = [{
      default: true,
      icon: "fa-solid fa-power-off",
      text: managedComfy ? "Start Orange + ComfyUI" : "Start Orange",
      href: "start.js",
    }]

    if (managedComfy) {
      items.push({
        icon: "fa-solid fa-link",
        text: "Start Orange Only (Use Existing ComfyUI)",
        href: "start-orange-only.js",
      })
    }

    items.push({
      icon: "fa-solid fa-arrows-rotate",
      text: "Update Orange",
      href: "update.js",
    })

    if (managedComfy) {
      items.push({
        icon: "fa-solid fa-shield-halved",
        text: "Update ComfyUI (Orange-tested)",
        href: "update-comfyui.js",
      }, {
        icon: "fa-solid fa-flask",
        text: "Update ComfyUI to Latest (Advanced)",
        href: "update-comfyui-latest.js",
      })
      if (rollbackAvailable) {
        items.push({
          icon: "fa-solid fa-clock-rotate-left",
          text: "Rollback ComfyUI",
          href: "rollback-comfyui.js",
        })
      }
    }

    items.push({
      icon: "fa-solid fa-screwdriver-wrench",
      text: "Repair Dependencies",
      href: managedSource ? "install-managed.js" : "install-orange.js",
    }, {
      icon: "fa-solid fa-triangle-exclamation",
      text: "Factory Reset (Deletes Local Data)",
      href: "reset.js",
    })

    return items
  }
}
