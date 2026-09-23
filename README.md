# Orange Pinokio Launcher

1-click launcher for [Orange](https://github.com/saintbrodie/Orange), a simple frontend for engineered **ComfyUI** workflows.

## Install Options

Pinokio offers two ways to install Orange:

### Orange + ComfyUI — Recommended

Installs a complete local runtime stack:

- `app/` — Orange
- `env/` — Orange Python environment
- `comfyui/ComfyUI/` — managed ComfyUI
- `comfy-env/` — ComfyUI Python environment
- `runtime/` — local managed-ComfyUI lifecycle state used for validation and rollback

When started, Pinokio runs Orange and the managed ComfyUI together. Orange receives the managed ComfyUI and model paths automatically, so its first-run wizard can configure the local backend without asking the user to find folders manually.

Fresh managed installs are checked out at the **Orange-tested ComfyUI revision** declared in `app/runtime/managed-runtime.json` instead of silently tracking whatever ComfyUI happens to publish that day. ComfyUI updates are explicit and independent from normal Orange updates.

The launcher intentionally does **not** pre-download Z-Image or any other workflow model. Curated workflows are optional; Orange inspects ComfyUI first and only downloads model dependencies for packs the user explicitly selects.

### Orange Only — Use Existing ComfyUI

Installs only Orange and its Python environment. Choose this if you already have ComfyUI running locally, through Stability Matrix, on another machine, or in another managed environment.

Orange does **not** require Pinokio or a Pinokio-managed ComfyUI. The first-run wizard asks for the ComfyUI URL, scans its available nodes and model dropdown inventory, and can reuse compatible curated-model variants that are already installed.

Orange never changes the Git revision, Python environment, or packages of an external / bring-your-own ComfyUI backend.

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

Orange tracks a single known-good ComfyUI commit in `app/runtime/managed-runtime.json`. The initial baseline was chosen from the ComfyUI revision being used while the current curated Orange workflows were actively dogfooded rather than automatically promoting the latest upstream commit.

Existing managed installations are **adopted without being moved** when this lifecycle feature first appears. Their current SHA is recorded as custom/tested as appropriate; the user explicitly chooses when to move to the Orange-tested revision.

### Updating and rollback

The Pinokio menu separates application updates from AI-runtime updates:

- **Update Orange** — updates the launcher, Orange source, and Orange Python requirements. It does not move ComfyUI.
- **Update ComfyUI (Orange-tested)** — checks out the revision declared by Orange and resyncs ComfyUI requirements.
- **Update ComfyUI to Latest (Advanced)** — checks out current upstream ComfyUI `HEAD`. This version is intentionally labeled untested by Orange.
- **Rollback ComfyUI** — appears after a ComfyUI revision actually changes and returns to the previously recorded revision.

Before a ComfyUI revision changes, Pinokio records the previous SHA. The next time Orange starts, it automatically runs Workflow Preflight for every installed Orange tool against the managed backend and stores a compact pass/fail result. Admin shows whether the current runtime is the Orange-tested revision, upstream/untested, or custom, plus the last validation result.

A failed Preflight does **not** silently roll back ComfyUI. The user can inspect the affected tools and choose **Rollback ComfyUI** from Pinokio.

## First Run

Open Orange after installation and follow the setup wizard. Fresh installs will:

1. Connect to ComfyUI and inspect its GPU/VRAM, node inventory, and model choices.
2. Show curated **Z-Image Turbo**, **Krea 2 Turbo**, **Klein 9B Turbo**, and **SeedVR2 7B Upscale** as optional tools. Z-Image is recommended for newcomers but is not required or selected automatically.
3. Report which curated workflows can already run using compatible declared models found on that ComfyUI backend.
4. For selected packs with missing dependencies, show exactly which model files Orange intends to download and select an appropriate INT8/FP8/BF16/FP16 variant for the hardware.
5. Reuse compatible existing model variants and download only missing dependencies when Orange has access to the ComfyUI model directory.
6. Run Orange Workflow Preflight before exposing each selected tool.
7. Ask you to create an Admin password.
8. Allow setup to finish with **zero curated tools installed**; advanced users can go directly to Admin and add/import their own workflows.

Existing Orange installations are not forced through this wizard when updating.

## Usage

- **Start Orange + ComfyUI** — shown for the complete managed stack.
- **Start Orange** — shown for Orange-only installs.
- **Open Orange** — opens the normal Orange UI at `http://127.0.0.1:7070`.
- **Open ComfyUI (Advanced)** — available when the launcher owns the managed ComfyUI instance.
- **Update Orange** — fast-forwards the launcher and Orange and resyncs Orange dependencies only.
- **Update ComfyUI (Orange-tested)** — moves managed ComfyUI to Orange's pinned known-good revision.
- **Update ComfyUI to Latest (Advanced)** — deliberately opts into current upstream ComfyUI.
- **Rollback ComfyUI** — returns to the prior recorded revision after a runtime change.
- **Repair Dependencies** — re-runs the matching install path without deleting Orange data or intentionally advancing ComfyUI.
- **Factory Reset (Deletes Local Data)** — removes Orange environments, managed-runtime state, and, for managed installs, the bundled ComfyUI installation too.

> [!WARNING]
> **Factory Reset is destructive.** Orange stores local configuration and history inside `app/`, so Factory Reset removes the local usage database, custom workflows, prompt files, Workflow Assets, and the managed ComfyUI/model files if present. Back up anything you want to keep first.

## Existing / Remote ComfyUI

Orange can connect to one or more local or LAN ComfyUI servers.

For curated packs, Orange first scans the model options ComfyUI exposes through `/object_info`. If a backend already has compatible declared model variants, Orange can bind those exact filenames and add the workflow without downloading anything. That path does not require filesystem access and works with remote ComfyUI servers.

If dependencies are missing, automatic download requires Orange to have a writable local/shared path to that backend's model storage. Orange shows the exact missing files before starting the install rather than assuming remote filesystem access.

External ComfyUI servers are compatibility-checked only. The managed update/rollback controls apply exclusively to the ComfyUI instance installed by this Pinokio launcher.

## Localhost vs LAN Access

The Pinokio launcher intentionally starts Orange on `127.0.0.1`, so the Orange UI is available only on the computer running Pinokio by default.

Orange's normal `run.bat` / `run.sh` launchers bind to `0.0.0.0` for LAN access. If you specifically want the Pinokio-managed instance exposed to your LAN, change the Uvicorn host in `start.js` to `0.0.0.0` and make sure you understand the network exposure involved.

## Updating Source

Orange/launcher source updates use `git pull --ff-only`. The launcher does **not** automatically stash modifications to tracked application source files. This avoids silently creating stash conflicts or re-applying stale code after an update.

Managed ComfyUI is intentionally different: it runs on a detached commit selected by the lifecycle helper, so normal Orange source updates cannot accidentally advance it.

Normal Orange user data is kept in paths that Orange already treats as local data, so routine configuration changes should not interfere with updates. If you manually modify tracked Orange source files, Git may require you to resolve or revert those changes before updating.

## Requirements

- [Pinokio](https://pinokio.computer)
- A supported system for ComfyUI if using the complete local stack
