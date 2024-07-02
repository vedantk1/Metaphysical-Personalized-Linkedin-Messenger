import { OpenAI } from "openai";

var tasks = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    loadButtons(); 
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
        const apiKey = document.getElementById('openAiApiInput').value;
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
