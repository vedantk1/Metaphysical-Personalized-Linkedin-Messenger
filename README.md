# Personalized AI Message Generator for LinkedIn

A Chrome extension for creating personalized LinkedIn messages using AI models. This tool uses OpenAI's models to generate contextually-aware messages, making your LinkedIn outreach more effective and efficient.

## Features

- Use your OpenAI's API key for generating messages and select model.
- Parse your Linkedin profile along with the receiver's linkedin profile to tailor messages.
- Outline and save your output preferences as tasks to be used while generation.
- Customize the system prompt for advanced behavior modifications.

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/vedantk1/Metaphysical-Personalized-Linkedin-Messenger
   ```
2. **Navigate to the Project Directory**
   ```bash
   cd Metaphysical-Personalized-Linkedin-Messenger
   ```
3. **Install Dependencies**
   ```bash
   npm install
   ```

   

## Usage

1. **Load the Extension in Chrome**
   - Open Chrome and navigate to \`chrome://extensions/\`.
   - Enable \`Developer mode\` in the top right corner.
   - Click \`Load unpacked\` and select the \`Metaphysical-Personalized-Linkedin-Messenger\` directory.

2. **Configure the Extension**
   - Open the extension from the Chrome toolbar.
   - Navigate to the \`Settings\` page.
   - Input your OpenAI API key.
   - Customize the system prompt or choose default. It is recommended to use the default system prompt.
   - Enter your LinkedIn profile details or load them automatically. To load, first navigate to your Linkedin profile webpage in chrome. The extension parses the opened webpage to load your profile when the load button is clicked.
   - Add and manage tasks with specific names and descriptions. The desription of the selected task is used for adapting to your usecase while generating outputs.
   - Click on 'Save'.

3. **Generate LinkedIn Messages**
   - Select a task and model from the dropdown menus on the main page.
   - Navigate to the Linkedin profile webpage of the individual you want to contact in chrome.
   - Open extension and click \`Generate Message\` to create a LinkedIn message to them.
   - View the generated message in the output text area after a few seconds.

## Files

- **manifest.json**: Extension metadata and permissions.
- **popup.html**: HTML structure for the main page.
- **settings.html**: HTML structure for the settings page.
- **popup.js**: JavaScript logic for the main page.
- **settings.js**: JavaScript logic for the settings page.
- **package.json**: Project dependencies and scripts.

## Dependencies

- **core-js**: ^3.37.1
- **openai**: ^4.52.1
- **@babel/core**: ^7.24.7
- **@babel/preset-env**: ^7.24.7
- **babel-loader**: ^9.1.3
- **webpack**: ^5.92.1
- **webpack-cli**: ^5.1.4

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for review.