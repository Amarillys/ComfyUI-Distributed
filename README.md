<div align="center">
<img width="320" src="https://github.com/user-attachments/assets/537d38cc-2e34-4527-bca7-0d79f4120cce" />
<br><br>
<a href="">📺Video Tutorial</a> |
<a href="/docs/worker-setup-guides.md">📝Setup Guides</a> | 
<a href="/workflows">⚙️Workflows</a> |
<a href="https://buymeacoffee.com/robertvoy">🎁Donation</a> 
<br><br>
</div>

> **A powerful extension for ComfyUI that enables distributed and parallel processing across multiple GPUs and machines. Generate more images and videos and accelerate your upscaling workflows by leveraging all available GPU resources in your network.**

![Clipboard Image (7)](https://github.com/user-attachments/assets/66aaadef-f195-48a1-a368-17dd0dae477d)

---

## Key Features

#### Parallel Workflow Processing
- Run workflows on multiple GPUs simultaneously with varied seeds
- Scale output with more workers
- Supports images and videos

#### Distributed Upscaling
- Accelerate Ultimate SD Upscale by distributing tiles across GPUs
- Intelligent distribution
- Handles single images and batches

#### Ease of Use
- Auto-setup local workers; easily add remote/cloud ones
- Convert any workflow to distributed with 2 nodes
- JSON configuration with UI controls

---

## Requirements

- ComfyUI
> Note: Desktop app not currently supported
- Multiple GPUs
- That's it

---

## Installation

1. **Clone this repository** into your ComfyUI custom nodes directory:
   ```bash
   git clone https://github.com/robertvoy/ComfyUI-Distributed.git
   ```
   
2. **Restart ComfyUI** - If you'll be using remote/cloud workers, add `--enable-cors-header` to your launch arguments on the master

3. Read the [setup guide](https://github.com/robertvoy/ComfyUI-Distributed/blob/feature/cloud-workers/docs/worker-setup-guides.md) for adding workers

---

## Workflow Examples

### Basic Parallel Generation
Generate multiple images in the time it takes to generate one. Each worker uses a different seed. Works with any workflow that outputs images.

![Clipboard Image (6)](https://github.com/user-attachments/assets/9598c94c-d9b4-4ccf-ab16-a21398220aeb)

> [Download workflow](/workflows/distributed-txt2img.json)

1. Open your ComfyUI workflow
2. Add **Distributed Seed** → connect to sampler's seed
3. Add **Distributed Collector** → after VAE Decode
4. Enable workers in the UI
5. Run the workflow!

### Parallel WAN Generation
Generate multiple videos in the time it takes to generate one. Each worker uses a different seed. Works with any workflow that outputs images, including video frames.

![Clipboard Image (5)](https://github.com/user-attachments/assets/5382b845-833b-43b7-b238-a91c5579581a)

> [Download workflow](/workflows/distributed-wan.json)

1. Open your WAN ComfyUI workflow
2. Add **Distributed Seed** → connect to sampler's seed
3. Add **Distributed Collector** → after VAE Decode
4. Add **Image Batch Divider** → after Distributed Collector
5. Set the `divide_by` to the number of GPUs you have available
> For example: if you have a master and 2x workers, set it to 3
7. Enable workers in the UI
8. Run the workflow!

### Distributed Upscaling
Accelerate the process by distributing tiles across multiple workers, with speed scaling as you add more GPUs.

![Clipboard Image (3)](https://github.com/user-attachments/assets/ffb57a0d-7b75-4497-96d2-875d60865a1a)

> [Download workflow](/workflows/distributed-txt2img.json)

1. Load your image
2. Upscale with ESRGAN or similar
3. Connect to **Ultimate SD Upscale Distributed**
4. Configure tile settings
5. Enable workers for faster processing

---

## FAQ

<details>
<summary>Does it combine VRAM of multiple GPUs?</summary>
No, it does not combine VRAM of multiple GPUs.
</details>

<details>
<summary>Does it speed up the generation of a single image or video?</summary>
No, it does not speed up the generation of a single image or video. Instead, it enables the generation of more images or videos simultaneously. However, it can speed up the upscaling of a single image when using the Ultimate SD Upscale Distributed feature.
</details>

<details>
<summary>Does it work with the ComfyUI desktop app?</summary>
Currently, it is not compatible with the ComfyUI desktop app.
</details>

<details>
<summary>Can I combine my RTX 5090 with a GTX 980 to get faster results?</summary>
Yes, you can combine different GPUs, but performance is optimized when using similar GPUs. A significant performance imbalance between GPUs may cause bottlenecks. For upscaling, setting `static_distribution` to `false` allows the faster GPU to handle more processing, which can mitigate some bottlenecks. Note that this setting only applies to upscaling tasks.
</details>

<details>
<summary>Does this work with cloud providers?</summary>
Yes, it is compatible with cloud providers. Refer to the [setup guides](https://github.com/robertvoy/ComfyUI-Distributed/blob/feature/cloud-workers/docs/worker-setup-guides.md) for detailed instructions.
</details>

<details>
<summary>Can I make this work with my Docker setup?</summary>
Yes, it is compatible with Docker setups, but you will need to configure your Docker environment yourself. Unfortunately, assistance with Docker configuration is not provided.
</details>

---

## Disclaimer

This software is provided "as is" without any warranties, express or implied, including merchantability, fitness for a particular purpose, or non-infringement. The developers and copyright holders are not liable for any claims, damages, or liabilities arising from the use, modification, or distribution of the software. Users are solely responsible for ensuring compliance with applicable laws and regulations and for securing their networks against unauthorized access, hacking, data breaches, or loss. The developers assume no liability for any damages or incidents resulting from misuse, improper configuration, or external threats.

---

## Support the Project
If my custom nodes have added value to your workflow, consider fueling future development with a coffee! Your support helps keep this project thriving. Buy me a coffee at: https://buymeacoffee.com/robertvoy
