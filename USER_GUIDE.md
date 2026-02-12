# User Guide: Metaphysical Personalized LinkedIn Messenger

Use this guide for day-to-day operation of the extension.
For architecture, permissions, and development details, see `README.md`.

## Install
1. In the repository root, install dependencies:

```bash
npm install
```

2. Build the extension bundles:

```bash
npx webpack --config webpack.config.js
```

3. Open Chrome at `chrome://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project root folder (the folder containing `manifest.json`).

## First-Time Setup
1. Open extension popup.
2. Go to **Settings**.
3. Add OpenAI API key.
4. Add your profile context:
   - Paste manually, or
   - Open your own LinkedIn profile in active tab, then click **Load from active tab**.
5. Review system prompt (or restore default).
6. Add at least one task (name + description).

## Generate a Message
1. Open recipient LinkedIn profile in active tab.
2. Open extension popup.
3. Select task, model, tone, and length.
4. Optionally adjust CTA/compliment and additional context.
5. Click **Generate message**.
6. Use **Copy** or **Save to history**.

## Quick Troubleshooting
- Missing required field errors: complete all required settings.
- Wrong-page error: ensure active tab is `linkedin.com/in/...`.
- API failures: verify key validity, quota, and network access.
- Empty tasks dropdown: add tasks in Settings.

## Privacy Reminder
The extension stores settings in browser `localStorage` and sends generation context to OpenAI. Avoid using restricted or sensitive content.
