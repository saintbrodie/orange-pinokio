"""Offline smoke test: explicit uv targets override unrelated active/default venvs."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import venv
import zipfile


class UvTargetTest(unittest.TestCase):
    def test_path_local_targets(self):
        uv = shutil.which("uv")
        self.assertIsNotNone(uv, "Pinokio/CI must provide uv")
        with tempfile.TemporaryDirectory(prefix="orange uv target ") as temporary:
            root = Path(temporary)
            decoy = root / ".venv"
            venv.create(decoy, with_pip=False)
            env = {**os.environ, "VIRTUAL_ENV": str(decoy), "UV_PYTHON_DOWNLOADS": "never"}
            wheel = root / "orange_uv_probe-1.0-py3-none-any.whl"
            info = "orange_uv_probe-1.0.dist-info"
            with zipfile.ZipFile(wheel, "w") as archive:
                archive.writestr("orange_uv_probe.py", "VALUE = 'target-only'\n")
                archive.writestr(f"{info}/METADATA", "Metadata-Version: 2.1\nName: orange-uv-probe\nVersion: 1.0\n")
                archive.writestr(f"{info}/WHEEL", "Wheel-Version: 1.0\nGenerator: orange-test\nRoot-Is-Purelib: true\nTag: py3-none-any\n")
                archive.writestr(f"{info}/RECORD", "")

            def python(env_dir):
                return env_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

            for cwd, name in [(root / "app", "env"), (root / "comfyui" / "ComfyUI", "comfy-env")]:
                cwd.mkdir(parents=True)
                target = cwd / name
                venv.create(target, with_pip=False)
                requirements = cwd / "requirements.txt"
                requirements.write_text(str(wheel) + "\n", encoding="utf-8")
                command = [uv, "pip", "install", "--python", f"./{name}", "--no-index", "--no-deps", "-r", str(requirements)]
                subprocess.run(command, cwd=cwd, env=env, check=True)
                # Exercise the same upgrade/reinstall and index-strategy flags used by Torch.
                subprocess.run(command + ["--upgrade", "--force-reinstall", "--index-strategy", "unsafe-best-match"],
                               cwd=cwd, env=env, check=True)
                result = subprocess.check_output([str(python(target)), "-c", "import orange_uv_probe; print(orange_uv_probe.VALUE)"], text=True)
                self.assertEqual(result.strip(), "target-only")
            result = subprocess.check_output([str(python(decoy)), "-c", "import importlib.util; print(importlib.util.find_spec('orange_uv_probe'))"], text=True)
            self.assertEqual(result.strip(), "None")


if __name__ == "__main__":
    unittest.main()
