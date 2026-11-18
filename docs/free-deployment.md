# Free deployment — checked 18 November 2026

| Resource | Role | Free boundary |
| --- | --- | --- |
| Cloudflare Pages | Static website at vani.amritkumar.dev | Free plan: custom domains, 500 builds/month, 25 MiB maximum asset size. Existing domain renewal is separate. |
| Hugging Face ZeroGPU | Your own Qwen3-ASR server | Personal account must have verified email and be over 30 days old; up to two free Spaces. Anonymous visitors: two minutes GPU quota/day; free signed-in users: five minutes/day. Queues and availability limits apply. |
| GitHub Free | Public source repository | Public repositories and static GitHub Pages are available on Free. Pages can also host this frontend on an existing domain as an alternative. |

Sources: [Cloudflare limits](https://developers.cloudflare.com/pages/platform/limits/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [ZeroGPU eligibility and quotas](https://huggingface.co/docs/hub/spaces-zerogpu), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). These published policies are not a perpetual free-service guarantee.

Netlify is another frontend option: its [Free plan](https://www.netlify.com/pricing/) includes custom domains/SSL with 300 credits/month. It does not supply free persistent Qwen GPU inference. The existing portfolio already points to Netlify; preserve those DNS records.

## Architecture

The website runs on your domain. Recordings go directly to your own public ZeroGPU Space through the Gradio client. Visitors download normal web assets but no model weights. Hugging Face's [direct custom-domain feature](https://huggingface.co/docs/hub/spaces-custom-domain) requires a paid plan and is not used. No token or paid inference API belongs in the website.

## Publish the speech service

Proposed ID: `shubhamsingh123/vani-speech`. This is a target, not a claimed live deployment.

1. Sign in to your Hugging Face account and verify its eligibility. Create a **Gradio** Space and choose **ZeroGPU** explicitly. Do not select paid hardware or add credits.
2. Run `python prepare_release.py`, then upload the five files from `dist/space` to the Space repository root. Its README specifies Python 3.12.12, Gradio 6.32.0 and native Transformers.
3. Wait for the build. Confirm ZeroGPU hardware and test actual English, Hindi and mixed recordings, including quota behavior as a logged-out visitor. GPU latency is unmeasured until this succeeds.
4. The frontend calls the named `/transcribe` endpoint and expects one JSON result containing `text`, `language`, `audio_seconds` and inference metadata.

Alternatively, after installing `hosting/requirements.txt` in `.venv-hosted`, use that environment's `hf auth login` command yourself, then run `python publish_space.py` in it. The script checks the signed-in owner, requests only ZeroGPU and refuses to overwrite an existing Space. It does not print tokens or write them to the project.

In this prepared Windows environment the exact commands are:

```powershell
cd D:\Vani
.\.venv-hosted\Scripts\python.exe -m huggingface_hub.cli.hf auth login
.\.venv-hosted\Scripts\python.exe publish_space.py --space shubhamsingh123/vani-speech
```

Enter credentials only in the official login flow, not in chat or source files. A public username alone does not give the agent authenticated access. If creating/uploading through the dashboard instead, use `dist/vani-space.zip`'s contents.

## Publish the website

1. Upload `dist/web` as a new Cloudflare Pages Direct Upload project. Use the Free plan. No framework build or server function is required.
2. Test its generated HTTPS `*.pages.dev` address. `config.json` must point to your successfully deployed Space; do not borrow another person's demo endpoint.
3. Add **vani.amritkumar.dev** under the Pages project's Custom domains.
4. At the current DNS provider, add a **new** CNAME named `vani`, targeting the project's actual generated `*.pages.dev` hostname. Do not guess that hostname or point it directly to `hf.space`.
5. Preserve the apex A record (`75.2.60.5`), `www` → `amrit2603-portfolio.netlify.app`, and unrelated records. A subdomain can use an external DNS provider; no portfolio nameserver transfer is required.
6. Wait for DNS/TLS validation. Test the exact HTTPS domain on desktop/mobile, then add the verified demo link to the GitHub README and portfolio.

Public DNS currently points to name.com authoritative nameservers, so the new record belongs in the domain's Name.com DNS settings. Publication requires authenticated hosting sessions and that DNS access. No login, DNS change, Space creation, GitHub push or public deployment is claimed until performed and verified.
