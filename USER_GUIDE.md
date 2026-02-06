# User Guide: Personalized AI LinkedIn Messenger (Chrome Extension)

## What This Extension Does
This extension helps you generate personalized LinkedIn outreach messages using OpenAI models.

It combines:
- Your profile context
- The recipient's LinkedIn page text (from the active tab)
- A saved task/purpose (for example: "ask for informational interview")
- Tone and length preferences

## Prerequisites
- Google Chrome
- An OpenAI API key
- This project downloaded locally

## Install the Extension
1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Build the extension bundle:

```bash
npx webpack --config webpack.config.js
```

4. Open Chrome and go to `chrome://extensions/`.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select this project folder:
   - `/Users/vedan/Projects/Metaphysical-Personalized-Linkedin-Messenger`

## First-Time Setup
1. Open the extension popup.
2. Go to **Settings**.
3. Add your OpenAI API key.
4. Add your user profile context:
   - Either paste it manually, or
   - Open your own LinkedIn profile page in Chrome and use **Load User Profile** to auto-extract and clean it.
5. Review or edit the system prompt (or use default).
6. Add at least one task:
   - **Task name**: short label shown in dropdown (example: `Networking`)
   - **Task description**: actual goal/instruction used in prompt (example: `Ask for a short informational chat about data roles`)

## Understanding “Tasks” in This Extension
A task is a saved prompt preset, not a scheduled background task.

Each task has:
- `key` (name): visible in the main dropdown
- `value` (description): inserted into the model prompt as the message objective

## Generate a Message
1. In Chrome, open the LinkedIn profile of the person you want to message.
2. Open the extension popup.
3. Choose:
   - Task
   - Model
   - Tone
   - Length
4. Optional:
   - Toggle **Include CTA**
   - Toggle **Include light compliment**
   - Add extra context in **Additional context**
5. Click **Generate Message**.
6. Review output in the text area.

## History and Reuse
- Use **Save** to store a generated message in local history.
- Use **Copy** to copy the current output.
- Use **Clear** to clear the current output/history section (as available in popup actions).

## Settings Reference
### API Key
Stored locally in your browser `localStorage`.

### User Profile
Your summarized profile context used to personalize outreach.

### System Prompt
Controls model behavior. Default prompt is optimized for short, professional LinkedIn outreach.

### Model
Model choice is stored locally and reused next time.

### Tasks
Saved locally. You can add, remove individual tasks, or remove all.

## Recommended Workflow
1. Keep a high-quality user profile summary in Settings.
2. Create 3-6 reusable tasks (referral, networking, sales intro, podcast invite, etc.).
3. For each recipient, open their LinkedIn profile before clicking **Generate Message**.
4. Add brief additional context when needed (shared connection, event, recent post).

## Troubleshooting
### “Missing settings. Add your API key, profile, prompt, and task in Settings.”
Go to Settings and ensure all are present:
- API key
- User profile
- System prompt
- At least one task selected (not placeholder)

### Message generation fails
- Verify API key is valid and has quota.
- Confirm internet connection.
- Try a different model.
- Check browser console for OpenAI errors.

### Task not showing in dropdown
- Make sure task has both name and description.
- Return to popup after saving tasks.
- Reload extension in `chrome://extensions/` if needed.

### LinkedIn content not captured
- Ensure the intended LinkedIn profile tab is active.
- Retry generation while on the correct profile page.

## Privacy Notes
- This extension uses browser `localStorage` for settings/tasks/history.
- Recipient page text and your profile context are sent to OpenAI when generating messages.
- Review your organization's policy before using personal or sensitive data.

## Updating After Code Changes
If code changes are made:

```bash
npx webpack --config webpack.config.js
```

Then reload the extension from `chrome://extensions/`.
