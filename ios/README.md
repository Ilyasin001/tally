# Tally for iOS

A native iOS app built with [xtool](https://github.com/xtool-org/xtool), which builds
SwiftPM packages into iOS apps on Linux, Windows (via WSL) and macOS, with no Xcode
project.

The app is a small Swift wrapper around the same web build that runs on the website:

- **`TallyApp.swift`**: the SwiftUI entry point.
- **`WebAppView.swift`**: a full-screen `WKWebView`. It also handles three things a web
  view can't do alone: native `alert()`/`confirm()` dialogs, the share sheet for
  backups, and opening outside links in Safari.
- **`BundleSchemeHandler.swift`**: serves the bundled build at `tally://app/`, so the
  app works offline and the page has a proper origin.
- **`NativeStore.swift`**: keeps a copy of your data in Application Support. That way
  it survives even if iOS clears the web view's storage.

## Install on your iPhone from Windows

You need WSL, an Apple ID (a free one works), and an iPhone connected over USB.

### 1. Set up WSL (once)

In PowerShell **as Administrator**:

```powershell
wsl --install -d Ubuntu
winget install --interactive --exact dorssel.usbipd-win
```

Restart Windows when asked. Then open **Ubuntu** from the Start menu and create your
Linux user.

### 2. Install the tools inside Ubuntu (once)

1. Install the Swift toolchain for Ubuntu from <https://swift.org/install/linux>.
2. Install usbmuxd and xtool:

```bash
sudo apt-get update && sudo apt-get install -y usbmuxd libimobiledevice-utils
curl -fL "https://github.com/xtool-org/xtool/releases/latest/download/xtool-$(uname -m).AppImage" -o xtool
chmod +x xtool && sudo mv xtool /usr/local/bin/
xtool --help
```

### 3. Connect the iPhone to WSL

Plug in the phone, unlock it and tap **Trust**. Then, in PowerShell as Administrator:

```powershell
usbipd list                      # find the "Apple Mobile Device" BUSID, e.g. 2-3
usbipd bind --busid 2-3
usbipd attach --wsl --busid 2-3
```

Back in Ubuntu, `ideviceinfo` should print your phone's details. If xtool later
reports `AFCClient.Error.muxError`, follow the workaround linked in xtool's
[Linux install guide](https://xtool.sh/documentation/xtooldocs/installation-linux).

### 4a. Quick route: install the prebuilt app (no Xcode download)

Every push builds an unsigned `.ipa` on GitHub. Open the repo's **Actions** tab, then
the latest **iOS build** run, and download **Tally-unsigned-ipa**. Unzip it into your
Ubuntu home folder, then:

```bash
xtool auth login        # sign in with your Apple ID (password + 2FA, sent only to Apple)
xtool install Tally.ipa # signs it for your phone and installs it
```

### 4b. Full route: build it yourself

This needs `Xcode.xip`, which you download from Apple with your Apple ID (see xtool's
install guide). Then:

```bash
xtool setup             # login + point it at Xcode.xip (one time)
cd /mnt/c/Users/<you>/OneDrive/Desktop/Projects/Habit\ Tracker
npm ci && npm run ios:web
cd ios && xtool dev     # builds, signs, installs and launches on the phone
```

### 5. First launch on the phone

- **Settings → Privacy & Security → Developer Mode**: turn it on and restart (iOS 16+).
- **Settings → General → VPN & Device Management**: trust your Apple ID's developer
  profile.

With a **free** Apple ID, Apple lets sideloaded apps run for 7 days. After that, run
`xtool install` (or `xtool dev`) again. Your data stays on the phone between installs.

## Working on it

- `npm run ios:web` builds the web app into `Sources/Tally/Web/` (git ignores it).
  Run it again after changing anything in `src/`.
- `xtool dev build --ipa` builds an unsigned `.ipa` without signing in. This is what the
  **iOS build** workflow runs on GitHub's macOS machines.
- The bundle ID is set in `xtool.yml` (`com.ilyasin001.tally`). Display name,
  orientations and version are in `Info.plist`, and the icon is
  `Resources/AppIcon.png`.
