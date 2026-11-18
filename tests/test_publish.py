import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import publish_space


class PublishTests(unittest.TestCase):
    def test_other_account_cannot_publish(self):
        api = Mock()
        api.whoami.return_value = {"name": "another-owner"}
        with patch.object(sys, "argv", ["publish_space.py"]), patch.object(publish_space, "prepare", return_value=Path("dist")), patch.object(publish_space, "HfApi", return_value=api):
            with self.assertRaises(SystemExit):
                publish_space.main()
        api.create_repo.assert_not_called()
        api.upload_folder.assert_not_called()

    def test_existing_space_is_not_overwritten(self):
        api = Mock()
        api.whoami.return_value = {"name": "shubhamsingh123"}
        api.repo_exists.return_value = True
        with patch.object(sys, "argv", ["publish_space.py"]), patch.object(publish_space, "prepare", return_value=Path("dist")), patch.object(publish_space, "HfApi", return_value=api):
            with self.assertRaises(SystemExit):
                publish_space.main()
        api.create_repo.assert_not_called()
        api.upload_folder.assert_not_called()


if __name__ == "__main__":
    unittest.main()
