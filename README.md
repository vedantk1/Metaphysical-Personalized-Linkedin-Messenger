# Metaphysical Personalized LinkedIn Messenger

Chrome extension (Manifest V3) for generating personalized LinkedIn outreach messages with OpenAI.

The extension builds each message from:
- your profile context
- recipient profile text from the active LinkedIn tab
- a saved task objective
- tone, length, and style options

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configure the Extension](#configure-the-extension)
- [Generate Messages](#generate-messages)
- [Permissions](#permissions)
- [Data Storage and Privacy](#data-storage-and-privacy)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features
- Personalized message generation using OpenAI chat completions
- Task presets (`name` + `description`) for reusable outreach goals
- Tone and length controls (Short, Medium, Long)
- Optional CTA and compliment toggles
- Additional context input per message
- "Load from active tab" profile extraction
- Optional profile cleanup step using OpenAI
- Local message history (most recent 5 saved messages)
- Theme support (system, light, dark)

## How It Works
1. You open a LinkedIn profile page in Chrome.
2. The extension reads `document.body.innerText` from the active tab.
3. It combines recipient text with your saved settings and selected task.
4. It sends a request to OpenAI and renders one ready-to-send message.

## Requirements
- Google Chrome (Manifest V3 support)
- Node.js and npm (for local build)
- OpenAI API key

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Metaphysical-Personalized-Linkedin-Messenger
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension bundles:
   ```bash
   npx webpack --config webpack.config.js
   ```
4. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the project root folder (the folder containing `manifest.json`)

## Configure the Extension
1. Open the extension popup and click **Settings**.
2. Add your OpenAI API key.
3. Add your profile context:
   - Paste manually, or
   - Open your LinkedIn profile in the active tab and click **Load from active tab**.
4. Review the system prompt (or restore default).
5. Add at least one task:
   - Task name: dropdown label in popup
   - Task description: outreach goal injected into prompt

All settings save automatically.

## Generate Messages
1. Open the target LinkedIn profile in the active tab.
2. Open popup and select:
   - task (required)
   - model
   - tone
   - length
3. Optionally set CTA/compliment toggles and extra context.
4. Click **Generate message**.
5. Use **Copy** or **Save to history** as needed.

## Permissions
From `manifest.json`:
- `activeTab`: access current tab for profile text extraction
- `scripting`: run tab script to read page text
- `host_permissions` for `https://api.openai.com/`: call OpenAI API

## Data Storage and Privacy
This extension stores data in browser `localStorage`, including:
- API key (`apiKey`)
- user profile (`userProfile`)
- system prompt (`systemPrompt`)
- tasks (`tasks`)
- generation preferences (`model`, `tone`, `length`, `includeCta`, `includeCompliment`, `themePreference`)
- history (`messageHistory`)

Important notes:
- Recipient page text, your profile, and prompt context are sent to OpenAI during generation.
- API keys in `localStorage` are not encrypted by this project.
- Do not use sensitive data unless it is allowed by your policy and OpenAI account settings.

## Project Structure
```text
.
|- manifest.json
|- popup.html
|- settings.html
|- styles.css
|- background.js
|- src/
|  |- popup.js
|  |- settings.js
|- dist/
|  |- popup.bundle.js
|  |- settings.bundle.js
|- webpack.config.js
|- README.md
|- USER_GUIDE.md
```

## Development Workflow
1. Edit source files under `src/`, HTML, or styles.
2. Rebuild bundles:
   ```bash
   npx webpack --config webpack.config.js
   ```
3. Reload extension in `chrome://extensions/`.
4. Retest popup and settings flows.

## Troubleshooting
### "Missing API key/profile/system prompt/tasks"
Open **Settings** and provide all required fields.

### "Open a LinkedIn profile URL..."
Make sure the active tab URL matches `linkedin.com/in/...`.

### Generation fails
- Verify API key validity and account quota.
- Check network connectivity.
- Try another supported model.
- Inspect extension errors in Chrome DevTools.

### Task dropdown is empty
Add at least one task with both name and description in Settings.

## Contributing
Contributions are welcome.

Suggested flow:
1. Fork the repository.
2. Create a feature branch.
3. Make and test changes.
4. Open a pull request with a clear description.

## License
No license file is currently included in this repository.
If you want open-source reuse, add a license file (for example, `LICENSE`).
