"""Publish a new, explicitly named ZeroGPU Space using the owner's cached HF login."""
import argparse

from huggingface_hub import HfApi, SpaceHardware

from prepare_release import prepare


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--space", default="shubhamsingh123/vani-speech")
    args = parser.parse_args()
    output = prepare(args.space)
    api = HfApi()
    account = api.whoami()
    owner = args.space.split("/")[0]
    if account["name"] != owner:
        raise SystemExit(f"Sign in as {owner}; refusing to publish under another account.")
    if api.repo_exists(args.space, repo_type="space"):
        raise SystemExit("That Space already exists. Choose an unused --space name; existing repositories are never overwritten.")
    api.create_repo(args.space, repo_type="space", space_sdk="gradio", space_hardware=SpaceHardware.ZERO_A10G, private=False)
    api.upload_folder(repo_id=args.space, repo_type="space", folder_path=output / "space",
                      allow_patterns=["app.py", "audio.py", "requirements.txt", "README.md", "LICENSE"],
                      commit_message="Add Vani multilingual transcription demo")
    print(f"Created https://huggingface.co/spaces/{args.space}. Wait for its build and verify ZeroGPU before publishing the frontend.")


if __name__ == "__main__":
    main()
