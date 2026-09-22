# Auto Frame

**Turns a static camera into an operated one.** Point a wide camera at a room and Auto Frame crops and scales the picture so your subject stays properly framed — panning and zooming smoothly as they move, like a camera operator following them. It's the same idea as Apple's Center Stage, except you control every part of how it behaves.

Faces are detected on-device using macOS's built-in Vision framework. **Nothing is uploaded, no account is needed, and no model file has to be downloaded.** It also works offline. And it doesn't have to follow faces — point it at any CHOP and it will frame whatever that CHOP describes.

> **Download** — grab `AutoFrame.plugin`, then follow [Installation](?id=installation). `TODO: link the packaged .plugin (zip) here once the download is hosted.`

*Requirements and install are the same across the suite — see [Requirements](?id=requirements) and [Installation](?id=installation). This page covers what's specific to Auto Frame.*

## Quick start

1. Connect a camera (a **Video Device In TOP**) to the Auto Frame node.
2. On the **Output** page, turn **Show Debug View** on.
3. Add a **Render Select TOP** after Auto Frame and set its index to `1` to see the debug view.

You should see your whole camera image with a bright rectangle on it — that rectangle is where the virtual camera is pointing. Sit in frame: it should settle around your face and then **stop moving**. Lean slightly and it should stay put; move properly across the room and it should follow smoothly and settle again.

Now turn **Show Debug View** off and look at the node's normal output. That's your framed shot.

## Why it holds still

A naive version of this eases the crop toward the face every frame and feels seasick. Three mechanisms stop that, and they're what make the shot look operated rather than nervous:

- **Deadzone with hysteresis.** While the subject sits near the current framing, the camera *does not move at all*. It starts moving only once they drift past the **Pan/Zoom Deadzone**, and then keeps going until it's *well* settled (**Settle Fraction**) — not merely back inside the deadzone. That second threshold is what stops the crop chattering on and off at the boundary.
- **Rate limiting.** **Max Pan/Zoom Per Frame** caps movement even mid-move, so a detection that jumps across the frame produces a smooth sweep instead of a teleport.
- **Separate pan and zoom speeds.** Zoom reads as far more intrusive than pan, so it defaults slower. Real operators reframe before they re-zoom.

The short version: if it feels twitchy, raise the deadzones. If it's sluggish to catch up, raise **Max Pan Per Frame** *before* **Pan Speed**.

## Making it feel right

This is the part worth spending five minutes on. All on the **Motion** page:

| If it feels… | Change this |
|---|---|
| Twitchy, keeps making small corrections | Raise **Pan Deadzone** |
| Slow to catch up with fast movement | Raise **Max Pan Per Frame** first, then **Pan Speed** |
| Like it's hunting / can't settle | Lower **Settle Fraction** (try `0.15`) |
| It keeps re-zooming slightly | Raise **Zoom Deadzone** |
| Zoom movement is distracting | Lower **Zoom Speed** and **Max Zoom Per Frame** |

**Pan Deadzone** and **Zoom Deadzone** work the same way — how far the subject has to drift before the camera reacts at all, in position and in size respectively. Zoom gets its own because people move toward and away from a camera more than they cross it, and you rarely want the shot breathing in and out.

## Framing controls

All on the **Framing** page.

| Parameter | Default | What it does |
|---|---|---|
| **Margin** | `1.2` | Space around the subject. Lower is a tighter shot; higher pulls back. The main "how close" control. |
| **Subject Offset (X, Y)** | `0, 0.08` | Where the subject sits in the frame. Positive **X** moves them right, positive **Y** moves them higher. The default gives a face conventional headroom. Because it's a fraction of the crop, framing looks the same at any zoom. |
| **Zoom Trim** | `1.0` | A straightforward tighter/wider dial (below 1 tighter, above 1 wider). Unlike Margin it doesn't change with subject size, so it's the more predictable one for fine adjustment. |
| **Min / Max Crop Width** | `0.3 / 1.0` | Zoom limits. *Min* stops it punching into a distant face until the picture turns to mush; *Max* caps how far out it pulls. |
| **Output Aspect** | `Match Input` | Match Input, 16:9, 4:3, 1:1, or **9:16 vertical**. The output is genuinely reshaped, not squashed, so you can pull a proper vertical shot from a horizontal camera. Raise **Margin** a little when you do. |
| **Frame All Faces** | `On` | Frame everyone in shot (union of all faces). Turn off to follow only the largest face — usually whoever is closest to camera. |

> When the subject walks near the edge of the camera's view, the framing clamps and they end up off-centre. That's correct — it's what a real camera does when it runs out of room, and it's better than showing black bars.

## When the subject leaves

On the **Motion** page:

- **Loss Hold Frames** *(default `45`)* — how long to hold the current framing after the subject disappears. Faces drop out for a frame or two all the time; this stops the camera reacting to it.
- **Return Home On Loss** *(default on)* — after the hold, ease back out to the full picture, like a real PTZ returning to its home preset. Turn off to freeze where it was.
- **Snap To Target** — a pulse that jumps straight to the correct framing with no smoothing. Handy when setting up.

## Outputs

### The picture

| Output | What it is |
|---|---|
| Default | Your framed shot, in the aspect you chose |
| Index 1 | Debug view — the whole camera image with the framing drawn on |

Read index 1 with a **Render Select TOP**. It shows the current framing (bright), where it's heading (dim), and the detected faces (white). Turn it on while setting up, off when you're done.

Output resolution keeps whichever input dimension it can and derives the other, so it never invents resolution that isn't in the source — a 1920×1080 input at 9:16 gives 608×1080. Add a **Resolution TOP** downstream if you need a specific size.

### The numbers

Attach an **Info CHOP** to read the framing each frame:

| Channel | What it tells you |
|---|---|
| `subject_count` | How many faces are being framed |
| `has_subject` | `1` when something is being tracked |
| `moving` | `1` while the camera is moving, `0` when settled |
| `frames_since_subject` | How long since anything was seen |
| `crop_x` `crop_y` `crop_w` `crop_h` | The exact area being shown |
| `crop_cx` `crop_cy` | Centre of that area |
| `zoom` | `1.0` = full picture, `2.0` = 2× punched in |
| `pan_error` | How far it still has to travel |

`moving` and `pan_error` are useful for **holding a camera cut until the move has settled**. `crop_*` lets a downstream node match the same framing exactly.

## Following something other than a face

Set a **Source CHOP** on the **Subject** page and Auto Frame follows that instead of faces — a hand, a tracked object, a bright region, anything you can put in a CHOP. Detection is skipped entirely when a source is set, so it costs nothing.

Channels are matched by their endings. **Only X and Y are required:**

| You have | X Suffix / Y Suffix | Width / Height Suffix |
|---|---|---|
| `peak_x` `peak_y` (saliency peak) | `_x` / `_y` | leave blank, set **Point Size** |
| `h0_palm_x` `h0_palm_y` (HandPose palm) | `_x` / `_y` | leave blank, set **Point Size** |
| `t0_cx` `t0_cy` `t0_w` `t0_h` (ObjectTrack) | `_cx` / `_cy` | `_w` / `_h` |

**Width / Height Suffix** are optional — fill them in when your CHOP describes a box with a size, leave them empty when it's just a position.

**CHOP X/Y Is** *(default Box Center)* — whether your X/Y is the middle of the thing or its bottom-left corner. Most CHOPs give a centre, which is why that's the default. If your framing sits low and to the right of where it should be, this is the setting to change.

**Point Size** *(default `0.15`)* — how much to frame around a bare point when your CHOP has no width or height. Larger pulls back, smaller punches in.

If a CHOP is connected but nothing matches, the node shows a warning instead of quietly falling back to faces.

## Other settings

- **Min Confidence** *(Subject, default `0.3`)* — how sure the detector must be before a face counts. Raise it if it's picking up faces in posters or reflections.
- **Bilinear** *(Output, default on)* — smooth scaling. The output is nearly always a zoomed-in crop, so leave this on unless you specifically want a hard, pixelated look.
- **Debug Color** *(Output)* — the colour of the framing rectangle in the debug view.
- **Help** *(About page)* — opens this documentation in your browser.

## Troubleshooting

**Nothing happens / no framing.** Check the camera is connected and producing an image. In very dim light or with a side-on subject, face detection may find nothing — watch `has_subject` in an Info CHOP.

**The framing jitters or drifts constantly.** Raise **Pan Deadzone** on the Motion page. That's exactly what it's for.

**It lags behind fast movement.** Raise **Max Pan Per Frame**, then **Pan Speed** if still needed.

**It's too tight or too wide.** Adjust **Margin** first; use **Zoom Trim** for smaller tweaks.

**The image looks squashed or stretched.** Make sure you're looking at the node's normal output, not the debug view — the debug view is always the shape of the incoming camera image.

**Following a CHOP, and the framing sits low and right of the subject.** Set **CHOP X/Y Is** to *Box Center*.

**I updated the plugin but nothing changed.** TouchDesigner only loads plugins at startup — quit and reopen it. To check which version is loaded, read the **About** page or the `build` row of an Info DAT. See [Installation](?id=installation).

## License & support

Auto Frame is free to use, including commercially — see the [License](?id=license) for the terms. Bug reports are welcome; the **build** string on the About page plus your TouchDesigner and macOS versions are the three most useful things to include.

**Nova Media Studio** — <a href="mailto:eduard@novamediastudio.co">eduard [at] novamediastudio [dot] co</a> · [novamediastudio.co](index.html?splash=false)
