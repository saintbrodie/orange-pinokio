# Orange Pinokio Launcher

1-click launcher for [Orange](https://github.com/saintbrodie/Orange), a simple frontend for engineered **ComfyUI** workflows.

## Install Options

Pinokio offers two ways to install Orange:

### Orange + ComfyUI — Recommended

Installs a complete local starter stack:

- `app/` — Orange
- `env/` — Orange Python environment
- `comfyui/ComfyUI/` — managed ComfyUI
- `comfy-env/` — ComfyUI Python environment

When started, Pinokio runs Orange and the managed ComfyUI together. Orange receives the managed ComfyUI and model paths automatically, so its first-run wizard can configure the local backend without asking the user to find folders manually.

The launcher intentionally does **not** pre-download a fixed Z-Image model. Orange starts ComfyUI first, reads the connected GPU/VRAM from `/system_stats`, then chooses the appropriate curated model precision during first-run setup.

### Orange Only — Use Existing ComfyUI

Installs only Orange and its Python environment. Choose this if you already have ComfyUI running locally, through Stability Matrix, on another machine, or in another managed environment.

Orange does **not** require Pinokio or a Pinokio-managed ComfyUI. The first-run wizard will simply ask for the ComfyUI URL and can use a local model path when one is available.

### Why `install.js` Does Not Install Anything

Some Pinokio builds/platforms automatically start a script named `install.js` immediately after adding an app. To keep that behavior from silently selecting the full Orange + ComfyUI stack, Orange reserves `install.js` as a short chooser shim only.

The actual installers are:

- `install-managed.js` — Orange + managed ComfyUI
- `install-orange.js` — Orange only

After the shim exits, the launcher presents both choices and neither is selected automatically.

## Managed ComfyUI Runtime

For NVIDIA systems, the managed installer uses current ComfyUI-style PyTorch routing rather than Pinokio's generic torch template:

- NVIDIA driver 580+ → CUDA 13.0 PyTorch wheels
- older supported NVIDIA drivers → CUDA 12.8 PyTorch wheels
- macOS → standard PyPI PyTorch / MPS build
- other GPU platforms fall back to Pinokio's platform-specific torch installer

The managed ComfyUI environment lives at launcher-root `comfy-env/`, which is the same path used by `start.js`.

## First Run

Open Orange after installation and follow the setup wizard. Fresh installs will:

1. Connect to ComfyUI and identify the available GPU/VRAM.
2. Offer the minimal **Z-Image Turbo** starter workflow.
3. Prefer native **INT8 ConvRot** when supported, otherwise choose an FP8/BF16 fallback appropriate for the pack and hardware.
4. Install the selected model files automatically when Orange has access to the ComfyUI model directory.
5. Optionally install curated **Krea 2 Turbo**, **Klein 9B Turbo**, and **SeedVR2 7B Upscale** tools.
6. Run Orange Workflow Preflight before exposing each selected tool.
7. Ask you to create an Admin password.
8. Open the simple Generate UI.

Existing Orange installations are not forced through this wizard when updating.

## Usage

- **Start Orange + ComfyUI** — shown for the complete managed stack.
- **Start Orange** — shown for Orange-only installs.
- **Open Orange** — opens the normal Orange UI at `http://127.0.0.1:7070`.
- **Open ComfyUI (Advanced)** — available when the launcher owns the managed ComfyUI instance.
- **Update** — fast-forwards the launcher and Orange; managed installs also update ComfyUI and re-sync dependencies.
- **Repair Dependencies** — re-runs the matching install path without deleting Orange data.
- **Factory Reset (Deletes Local Data)** — removes Orange environments and, for managed installs, the bundled ComfyUI installation too.

> [!WARNING]
> **Factory Reset is destructive.** Orange stores local configuration and history inside `app/`, so Factory Reset removes the local usage database, custom workflows, prompt files, Workflow Assets, and the managed ComfyUI/model files if present. Back up anything you want to keep first.

## Existing / Remote ComfyUI

Orange can connect to one or more local or LAN ComfyUI servers. Automatic model installation requires Orange to have filesystem access to that backend's model storage. Remote backends without a shared/local model path can still be health-checked, preflighted, routed, and used normally; Orange will report missing dependencies rather than assuming remote filesystem access.

## Localhost vs LAN Access

The Pinokio launcher intentionally starts Orange on `127.0.0.1`, so the Orange UI is available only on the computer running Pinokio by default.

Orange's normal `run.bat` / `run.sh` launchers bind to `0.0.0.0` for LAN access. If you specifically want the Pinokio-managed instance exposed to your LAN, change the Uvicorn host in `start.js` to `0.0.0.0` and make sure you understand the network exposure involved.

## Updating

Updates use `git pull --ff-only`. The launcher does **not** automatically stash modifications to tracked application source files. This avoids silently creating stash conflicts or re-applying stale code after an update.

Normal Orange user data is kept in paths that Orange already treats as local data, so routine configuration changes should not interfere with updates. If you manually modify tracked Orange source files, Git may require you to resolve or revert those changes before updating.

## Requirements

- [Pinokio](https://pinokio.computer)
- A supported system for ComfyUI if using the complete local stack
