# Orange Pinokio Launcher

1-click launcher for [Orange](https://github.com/saintbrodie/Orange), a minimalist web frontend for engineered **ComfyUI** workflows.

## What This Installs

The launcher keeps its runtime isolated inside the Pinokio app folder:

- `app/` — cloned Orange repository
- `env/` — Python virtual environment used by Orange

It installs **Orange only**. It does not install ComfyUI, custom nodes, or workflow models.

## Usage

- **Install** — Clones Orange into `app/` and installs its Python dependencies into `env/`.
- **Start** — Launches Orange at `http://127.0.0.1:7070`.
- **Update** — Fast-forwards both this launcher and Orange, then re-syncs Python dependencies.
- **Repair Dependencies** — Re-runs Orange's dependency installation without deleting your Orange data.
- **Factory Reset (Deletes Local Data)** — Deletes both `app/` and `env/` for a completely clean installation.

> [!WARNING]
> **Factory Reset is destructive.** Because Orange stores its local configuration and history inside `app/`, Factory Reset also removes the local usage database, custom workflows, prompt files, and Workflow Assets. Back up anything you want to keep before using it.

## Connecting Orange to ComfyUI

Orange needs at least one reachable ComfyUI backend.

The default Orange configuration points to:

`http://127.0.0.1:8188`

You can instead configure one or more local/LAN ComfyUI servers from Orange's **Admin Dashboard → General Settings**. Orange can health-check, preflight, route, and fail over across those configured backends.

Open the admin dashboard at:

`http://127.0.0.1:7070/admin`

## Localhost vs LAN Access

The Pinokio launcher intentionally starts Orange on `127.0.0.1`, so the Orange UI is available only on the computer running Pinokio by default.

Orange's normal `run.bat` / `run.sh` launchers bind to `0.0.0.0` for LAN access. If you specifically want the Pinokio-managed instance exposed to your LAN, change the Uvicorn host in `start.js` to `0.0.0.0` and make sure you understand the network exposure involved.

## Updating

Updates use `git pull --ff-only`. The launcher does **not** automatically stash modifications to tracked application source files. This avoids silently creating stash conflicts or re-applying stale code after an update.

Normal Orange user data is kept in paths that Orange already treats as local data, so routine configuration changes should not interfere with updates. If you manually modify tracked Orange source files, Git may require you to resolve or revert those changes before updating.

## Requirements

- [Pinokio](https://pinokio.computer)
- At least one running/reachable ComfyUI instance
