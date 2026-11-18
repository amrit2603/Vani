import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

import prepare_release


class ReleaseTests(unittest.TestCase):
    def test_export_is_static_and_omits_private_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "static").mkdir()
            (root / "hosting").mkdir()
            (root / "static" / "index.html").write_text("Vani", encoding="utf-8")
            for name in ("app.py", "requirements.txt", "README.md"):
                (root / "hosting" / name).write_text("public", encoding="utf-8")
            for name in ("audio.py", "LICENSE", ".env", "recording.wav"):
                (root / name).write_text("private" if name.startswith(".") else "public", encoding="utf-8")
            with patch.object(prepare_release, "ROOT", root):
                output = prepare_release.prepare("shubhamsingh123/vani-speech")
            with ZipFile(output / "vani-space.zip") as release:
                self.assertEqual(set(release.namelist()), {"app.py", "audio.py", "requirements.txt", "README.md", "LICENSE"})
            self.assertIn('shubhamsingh123/vani-speech', (output / "web" / "config.json").read_text(encoding="utf-8"))

    def test_invalid_space_id_cannot_be_exported(self):
        with self.assertRaises(ValueError):
            prepare_release.prepare("../../.env")


if __name__ == "__main__":
    unittest.main()
