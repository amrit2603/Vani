"""Export only public app files; never include environments, tokens, or test recordings."""
import argparse
import json
import re
import shutil
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent


def prepare(space):
    if not re.fullmatch(r"[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+", space):
        raise ValueError("Use a public Hugging Face Space ID such as shubhamsingh123/vani-speech.")
    output = ROOT / "dist"
    web = output / "web"
    backend = output / "space"
    web.mkdir(parents=True, exist_ok=True)
    backend.mkdir(parents=True, exist_ok=True)
    for source in (ROOT / "static").rglob("*"):
        if source.is_file():
            target = web / source.relative_to(ROOT / "static")
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
    (web / "config.json").write_text(json.dumps({"space": space}, indent=2) + "\n", encoding="utf-8")
    for name in ("app.py", "requirements.txt", "README.md"):
        shutil.copy2(ROOT / "hosting" / name, backend / name)
    for name in ("audio.py", "coaching.py", "LICENSE"):
        shutil.copy2(ROOT / name, backend / name)
    assert json.loads((web / "config.json").read_text(encoding="utf-8"))["space"] == space
    assert (web / "index.html").is_file() and (backend / "audio.py").is_file()
    for folder, archive in ((web, "vani-website.zip"), (backend, "vani-space.zip")):
        with ZipFile(output / archive, "w") as release:
            for source in folder.rglob("*"):
                if source.is_file():
                    release.write(source, source.relative_to(folder))
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--space", default="shubhamsingh123/vani-speech")
    args = parser.parse_args()
    print(prepare(args.space))
