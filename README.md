# Orange Pinokio Launcher

<p align="center">
  <img src="docs/pinokio.webp" width="100%" alt="Orange running in Pinokio" />
</p>

This is the Pinokio launcher for [Orange](https://github.com/saintbrodie/Orange), a simple frontend for engineered **ComfyUI** workflows.

The launcher can either install a complete Orange + ComfyUI stack or run Orange against a ComfyUI you already manage somewhere else.

## Install choices

### Orange + ComfyUI

This is the easiest local setup. Pinokio installs:

- `app/` for Orange
- `app/env/` for the Orange Python environment
- `comfyui/ComfyUI/` for the managed ComfyUI checkout
- `comfyui/ComfyUI/comfy-env/` for the ComfyUI Python environment
- `runtime/` for launcher state and logs

Orange and ComfyUI start together. Orange gets the managed ComfyUI and model paths automatically, so first-run setup does not ask you to hunt for folders.

The launcher uses the Orange-tested ComfyUI revision declared by Orange. ComfyUI updates are explicit and separate from normal Orange updates.

### Orange Only

Choose this if you already use ComfyUI through Stability Matrix, another launcher, another machine, or a remote server.

Orange connects through the ComfyUI API and leaves that external install alone. It does not change the external ComfyUI Git revision, Python environment, or packages.

Managed installs also include **Start Orange Only (Use Existing ComfyUI)**. That lets you temporarily use another ComfyUI without deleting the bundled one.

## Running Orange

When Orange is running, Pinokio exposes:

- **Open Orange**
- **Terminal**
- **Open ComfyUI (Advanced)** when the managed ComfyUI is running

The terminal stays quiet when idle and shows useful activity when something is happening, including startup state, LLM prompt enhancement, generation queueing, completions, warnings, and failures.

Full child-process logs are saved under `runtime/logs/`. Set `ORANGE_VERBOSE_LOGS=1` if you want the raw live output instead.

## LAN sharing and custom ports

Orange respects Pinokio's local-sharing setting directly.

```text
PINOKIO_SHARE_LOCAL=true
```

With no other network settings, that changes Orange from loopback-only to listening on all IPv4 interfaces (`0.0.0.0`) while keeping port `7070`.

You can override either value yourself:

```text
ORANGE_HOST=0.0.0.0
ORANGE_PORT=9090
```

`ORANGE_HOST` can be a specific hostname or IP address if you do not want to listen on every interface. `ORANGE_PORT` accepts any free TCP port from `1` through `65535`.

The defaults are:

```text
ORANGE_HOST=127.0.0.1
ORANGE_PORT=7070
```

`PINOKIO_SHARE_LOCAL_PORT` is separate. It controls the port used by Pinokio's own LAN proxy, not Orange's Uvicorn server. You can leave it blank for an automatically selected proxy port or set it to any other free port. Do not set it to the same port as `ORANGE_PORT`.

Sharing Orange on the LAN makes the Orange web interface reachable by other devices on that network, subject to the host firewall and network policy.

## Port conflicts

Startup checks Orange's configured port before launching.

- `ORANGE_PORT` defaults to `7070` and must be free for Orange.
- `8188` must be free when Pinokio is starting the managed ComfyUI.

If the Orange port is already in use, choose another `ORANGE_PORT`. If another ComfyUI is already using `8188`, close it and start the managed stack again, or choose **Start Orange Only (Use Existing ComfyUI)**.

## First run

Orange handles tool setup in the browser. It scans the connected ComfyUI first, then shows the curated tools that can be added.

The curated packs are optional. Orange can finish setup with zero curated tools installed, and compatible models that are already present can be reused instead of downloaded again.

## Updating

The Pinokio menu keeps Orange updates and ComfyUI updates separate:

- **Update Orange** updates the launcher, Orange source, and Orange Python requirements.
- **Update ComfyUI (Orange-tested)** moves the managed ComfyUI to the revision Orange currently targets.
- **Update ComfyUI to Latest (Advanced)** opts into current upstream ComfyUI.
- **Rollback ComfyUI** returns to the previous recorded revision after a managed runtime change.
- **Repair Dependencies** resyncs the selected install path without deleting Orange data.

Normal Orange updates do not silently advance the managed ComfyUI revision.

## Resetting

**Factory Reset (Deletes Local Data)** removes the Orange environment and local Orange data. On managed installs it also removes the bundled ComfyUI and its models.

Back up anything you want to keep before using Factory Reset.

## Requirements

- [Pinokio](https://pinokio.computer)
- A system supported by ComfyUI if you use the managed Orange + ComfyUI install

## License

The Orange Pinokio launcher is released under the [MIT License](LICENSE).

Orange, ComfyUI, and any model weights installed through Orange retain their own licenses and terms.
