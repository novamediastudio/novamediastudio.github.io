# Nova Media Plugins

**Native computer-vision operators for TouchDesigner on macOS.**

Real-time vision tools that appear in the Tab menu like any other TOP — no Python bridge, no model files, no network, no account. They use Apple's Vision framework, which is already on every Mac, so detection runs on-device at native speed and works with the machine in airplane mode.

Built for installations and live work, where a plugin that stalls the cook or drops out mid-show is worse than no plugin at all.

## Available now

**[Auto Frame](?id=autoframe)** — Virtual PTZ. Turns a static wide camera into an operated one: crops and scales the image so the subject stays framed, panning and zooming smoothly as they move. The same idea as Apple's Center Stage, with every part of the behaviour exposed. Follows faces out of the box, or anything you put in a CHOP.

*More operators from the suite will be listed here as they're released.*

## The ideas behind these

**Vision that's already on the machine.** macOS ships a mature vision stack — face and body pose, hand tracking, contours, saliency, object tracking — all available to any native app, tuned for Apple Silicon, with no dependency to install. Most TouchDesigner vision workflows route through Python with OpenCV or an ONNX runtime, which means an environment to manage and model files to ship. These skip all of that: a C++ Custom Operator calls Vision directly and uploads the result straight back into a TOP. The practical upshot for deploying a show — **nothing to install beside the plugin, and nothing that needs the internet.**

**Built for live, not for demos.** The difference between a vision demo and a vision tool is almost entirely in how it behaves when things go wrong. Inference runs on a background queue and never blocks the cook. Frames are dropped rather than queued, so under load you get the latest result, not a growing backlog. CHOP channel layouts are fixed — slots exist whether or not anything is detected — so your patch doesn't restructure itself because someone walked out of frame. And loss behaviour is explicit: every tracker states what it does when the subject disappears.

**Output you can patch into.** Normalized 0–1 coordinates with a bottom-left origin in every plugin — the same convention as Vision and TD's UV space, so nothing needs converting. Multiple colour buffers, read with a Render Select TOP. Info CHOP and Info DAT on everything.

**Consistent across the suite.** One coordinate convention, one way of binding a CHOP input (match channels by suffix), one About page and Help button. Learn one operator and the rest behave the way you expect — and they compose, so anything that emits a position can drive anything that consumes one.

## What these are not

- **macOS and Apple Silicon only.** They're built on Apple's frameworks; there's no Windows or Intel path.
- **No custom models.** You get what Vision provides, not a runtime for your own networks. If you need a specific trained model, an ONNX or CoreML route in Python is the right tool.
- **Not a replacement for OpenCV.** No general image-processing library here — these are focused operators for specific tasks.

## Getting set up

The [requirements](?id=requirements) and [installation steps](?id=installation) are the same for every plugin in the suite, so they live on their own pages. Each plugin page then covers only what's specific to that operator.
