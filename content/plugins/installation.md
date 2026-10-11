# Installation

Every plugin in the suite installs the same way: it's a single `.plugin` bundle you drop into TouchDesigner's Plugins folder. There's nothing to build and nothing else to install — see [requirements](?id=requirements) first.

## Steps

1. **Quit TouchDesigner.**

2. **Copy the `.plugin` file** into:

```
~/Library/Application Support/Derivative/TouchDesigner/Plugins/
```

Create the `Plugins` folder if it isn't there. In Finder, use **Go → Go to Folder…** and paste the path.

3. **Clear the macOS quarantine flag.** Open **Terminal**, type the following — *including the trailing space* — then **drag the `.plugin` file onto the Terminal window** and press Return:

```
xattr -cr 
```

Dragging fills in the full path for you and avoids typos. The finished line looks something like:

```
xattr -cr ~/Library/Application\ Support/Derivative/TouchDesigner/Plugins/AutoFrame.plugin
```

There's no output if it worked.

4. **Start TouchDesigner.**

5. **Add the node:** press **Tab**, choose **Custom**, and pick the operator.

> **Why step 3 matters.** macOS attaches a quarantine flag to anything that arrives from outside the machine — a download, AirDrop, email, or a cloud-drive sync. Gatekeeper then refuses to load the unsigned bundle **with no error at all** — the operator simply won't appear in the Tab menu. Clearing the flag fixes it. It's needed after **every update**, not just the first install.

Plugins are loaded **only when TouchDesigner starts**, so a restart is always required after installing or updating. To check which build is loaded, open the operator's **About** page or attach an **Info DAT** and read the `build` row.

## If TouchDesigner won't start after installing

Move the plugin out of the Plugins folder onto your Desktop, then start TouchDesigner again:

```
mv ~/Library/Application\ Support/Derivative/TouchDesigner*/Plugins/*.plugin ~/Desktop/
```

Then [get in touch](?id=overview) with your TouchDesigner and macOS versions.
