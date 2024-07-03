import { OpenAI } from "openai";

var tasks = [];
var userApiKey;
const defaultSystemPrompt = `
YOUR TASK is to assist users in crafting short LinkedIn messages to people based on their LinkedIn profiles. (Context: "The user will provide the LinkedIn profiles as parsed innertext from the HTML of the LinkedIn profile webpage. The user will also provide a user profile text to give more insight into the user's professional profile and background, helping to personalize the messages from the user's point of view. Additionally, the user will provide a specific task detailing the purpose of the LinkedIn message they want to create.") 

## Action Steps

### Extract Relevant Details

1. REVIEW the parsed innertext of the LinkedIn profile provided by the user.
2. IDENTIFY key details such as the person's job title, company, recent activities, shared connections, and any common interests or mutual groups.
3. ANALYZE the 'User Profile' text provided by the user to understand their background, interests, and objectives.
4. REVIEW the specific task provided by the user to understand the goal of the LinkedIn message.

### Crafting the Message

5. START with a polite and succinct opening greeting to maintain a professional tone.
6. PERSONALIZE the message by incorporating relevant details extracted from the LinkedIn profile.
7. ALIGN the message with the user's profile and goals based on their profile text and the specific user task details.
8. CLEARLY STATE the purpose of reaching out, as defined in the specific task.
9. HIGHLIGHT the recipient's relevant experience and expertise that align with the message's goal.
10. PROVIDE a concise overview of any relevant information (e.g., a podcast, event, or project) to contextualize the message.
11. INCLUDE a direct call to action to outline the next steps clearly.

### Formatting Guidelines

- FORMAT the message in a clear, concise, and professional manner.
- ENSURE the tone is always polite, succinct, and professional.

## Important Considerations

- FOCUS on making each message unique and personalized to the recipient's profile.
- AVOID generic or overly formal language that may seem impersonal.
`;

document.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    loadButtons(); 
    loadKeyFormatter()
    });

function loadSavedSettings() {
    const savedProfile = localStorage.getItem('userProfile');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedSystemPrompt = localStorage.getItem('systemPrompt');
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || []; 

    if (savedProfile) {
        document.getElementById('userProfile').value = savedProfile;
    }

    if (savedApiKey) {
        document.getElementById('openAiApiInput').value = savedApiKey;
        formatKey()

    }

    if (savedSystemPrompt) {
        document.getElementById('systemPrompt').value = savedSystemPrompt;
    }

    // Load tasks
    tasks = savedTasks;
    renderTasks();
}
function loadButtons() {

    document.getElementById('loadUserProfile').addEventListener('click', () => {
        //parse the profile content
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
              target: {tabId: tabs[0].id},
              function: () => parseUserProfile()
            });
          });
        // document.getElementById('userProfile').value = //parsed profile;
    });

    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'popup.html';
    });

    document.getElementById('saveSettingsButton').addEventListener('click', () => {
        const profile = document.getElementById('userProfile').value;
        const apiKey = userApiKey;
        const systemPrompt = document.getElementById('systemPrompt').value;
        // Save to localStorage
        localStorage.setItem('userProfile', profile);
        localStorage.setItem('apiKey', apiKey);
        localStorage.setItem('systemPrompt', systemPrompt);
        localStorage.setItem('tasks', JSON.stringify(tasks));
  
        alert('Settings saved!');
    });

    document.getElementById('addTaskButton').addEventListener('click', () => {
        const taskKey = document.getElementById('newTaskKey').value;
        const taskValue = document.getElementById('newTaskValue').value;
      
        if (taskKey && taskValue) {
            tasks.push({ key: taskKey, value: taskValue });
            // renderTasks();
          document.getElementById('newTaskKey').value = '';
          document.getElementById('newTaskValue').value = '';
          renderTasks();
        }
    });
    document.getElementById('removeAllTasksButton').addEventListener('click', () => {
        tasks = [];
        renderTasks();
    });
    document.getElementById('default-system-prompt-button').addEventListener('click', () => {
        document.getElementById('systemPrompt').value = defaultSystemPrompt;
    });
}
function loadKeyFormatter() {
    const apiKeyInput = document.getElementById('openAiApiInput');
    apiKeyInput.addEventListener('focus', () => {
        unformatKey();
    });
    apiKeyInput.addEventListener('blur', () => {
        formatKey();
    });
}
function parseUserProfile() {
    console.log('parseUserProfile() function called');
    const profile = document.body;
    if (profile) {
      const profileText = profile.innerText;
      console.log('userProfileText:', profileText);
      chrome.runtime.sendMessage({ action: "parsedUserProfile", profileContent: profileText });
    } else {
      console.log('profile not found');
    }
}
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "parsedUserProfile") {
      console.log('parsed user profile received: ' + message.profileContent);
      cleanProfile( message.profileContent );
    //   testFunction(message.profileContent);
    }
  });
async function cleanProfile(profileContent) {
    console.log('cleanProfile() function called. sending to openai');
    console.log("profileContent: " + profileContent);
    // Clean the profile content
    const apiKey = localStorage.getItem('apiKey');
    console.log("apiKey: " + apiKey);
    // const userProfile = localStorage.getItem('userProfile');
    const systemPrompt = "The user will provide the parsed html innerText of their entire linkedin profile webpage. The text will be full of duplications an irrelevant content. Your job is to filter through the useless content and summarize the important text.";
    const userTask = profileContent;
    console.log("userTask: " + userTask);
    const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
    console.log("OpenAI created");
    // console.log("model: " + document.getElementById('modelDropdown').value);
    const completion = await openai.chat.completions.create({
        messages: [{ 
            role: "system", 
            content: systemPrompt
            }, { 
            role: "user", 
            content: userTask 
        }],
        model: localStorage.getItem('model')
    });
    console.log("completion created: " + completion);
  
    const cleanedProfile = completion.choices[0].message.content;
    console.log("cleaned user profile: " + cleanedProfile);
    document.getElementById('userProfile').value = cleanedProfile;

}
function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {

        const inputWrapper = document.createElement('div')
        inputWrapper.className = 'input-wrapper';

        const taskName = document.createElement('p');
        taskName.textContent = task.key;

        const taskDescription = document.createElement('p');
        taskDescription.textContent = task.value;
        taskDescription.title = task.value; // This line sets the full text as the tooltip
        taskDescription.className = 'truncated';

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            console.log('remove button clicked');
            tasks.splice(index, 1);
            renderTasks();
        });

        inputWrapper.appendChild(taskName);
        inputWrapper.appendChild(taskDescription);
        inputWrapper.appendChild(removeButton);
        taskList.appendChild(inputWrapper);
    });
}
function formatKey(){

    const enteredApiKey = document.getElementById('openAiApiInput').value;
    if (enteredApiKey && enteredApiKey.length > 8) {
        const firstFour = enteredApiKey.slice(0, 4);
        const lastFour = enteredApiKey.slice(-4);
        const formattedKey = `${firstFour}...${lastFour}`;
        // localStorage.setItem('apiKey', enteredApiKey);
        document.getElementById('openAiApiInput').value = formattedKey;
    }
    userApiKey = enteredApiKey;

}
function unformatKey(){
    const enteredApiKey = userApiKey;
    if (enteredApiKey) {
        document.getElementById('openAiApiInput').value = enteredApiKey;
    }
}
