
import OpenAI from "openai";
console.log('event listener added to submit button!');
// const systemPrompt = `
// ## Task Description

// - **YOUR TASK** is to assist users in crafting short LinkedIn messages to people based on their LinkedIn profiles.

// (Context: "The user will provide the LinkedIn profiles as parsed innertext from the HTML of the LinkedIn profile webpage. The user will also provide a user profile text to give more insight into the user's professional profile and background, helping to personalize the messages from the user's point of view. Additionally, the user will provide a specific task detailing the purpose of the LinkedIn message they want to create.")

// ## Action Steps

// ### Extract Relevant Details

// 1. **REVIEW** the parsed innertext of the LinkedIn profile provided by the user.
// 2. **IDENTIFY** key details such as the person's job title, company, recent activities, shared connections, and any common interests or mutual groups.
// 3. **ANALYZE** the 'User Profile' text provided by the user to understand their background, interests, and objectives.
// 4. **REVIEW** the specific task provided by the user to understand the goal of the LinkedIn message.

// ### Crafting the Message

// 5. **START** with a polite and succinct opening greeting to maintain a professional tone.
// 6. **PERSONALIZE** the message by incorporating relevant details extracted from the LinkedIn profile.
// 7. **ALIGN** the message with the user's profile and goals based on their profile text and the specific user task details.
// 8. **CLEARLY STATE** the purpose of reaching out, as defined in the specific task.
// 9. **HIGHLIGHT** the recipient's relevant experience and expertise that align with the message's goal.
// 10. **PROVIDE** a concise overview of any relevant information (e.g., a podcast, event, or project) to contextualize the message.
// 11. **INCLUDE** a direct call to action to outline the next steps clearly.

// ### Formatting Guidelines

// - **FORMAT** the message in a clear, concise, and professional manner.
// - **ENSURE** the tone is always polite, succinct, and professional.

// ## Important Considerations

// - **FOCUS** on making each message unique and personalized to the recipient's profile.
// - **AVOID** generic or overly formal language that may seem impersonal.

// `;
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  // load tasks from local storage
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.forEach((task, index) => {
    const option = document.createElement('option');
    option.value = tasks[index].key;
    option.text = tasks[index].key;
    document.getElementById('taskDropdown').appendChild(option);
  });
  // load last saved model. if not found, set to default and save
  const model = localStorage.getItem('model');
  if (model) {
    document.getElementById('modelDropdown').value = model;
  } else {
    localStorage.setItem('model', 'gpt-3.5-turbo');
    document.getElementById('modelDropdown').value = localStorage.getItem('model');

  }
  // document.getElementById('taskDropdown')
});

document.getElementById('settingsButton').addEventListener('click', () => {
  console.log('settings button clicked!');
  window.location.href = 'settings.html';
});

document.getElementById('mainButton').addEventListener('click', () => {
  console.log('main button clicked!');
  
  const apiKey = localStorage.getItem('apiKey');
  const profile = localStorage.getItem('userProfile');
  const systemPrompt = localStorage.getItem('systemPrompt');
  const userTask = document.getElementById('taskDropdown').value;

  // console.log('apiKey:', apiKey);
  // console.log('profile:', profile);
  // console.log('systemPrompt:', systemPrompt);
  // console.log('userTask:', userTask);

  if (apiKey && profile && userTask !== 'default' && systemPrompt) {
    console.log('found stored apiKey, profile and systemPrompt. UserTask selected!');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: () => parseProfile()
      });
    });
  } else {
    console.log('missing apiKey, profile, userTask, or systemPrompt');
    alert('Please enter your API key, user profile, system prompt, and user task in the settings page before proceeding.');
  }
});

document.getElementById('modelDropdown').addEventListener('change', () => {
  const model = document.getElementById('modelDropdown').value;
  console.log('model changed: ' + model);
  localStorage.setItem('model', model);
});

function parseProfile() {
  console.log('parseProfile function called');
  const profile = document.body;
  if (profile) {
    const profileText = profile.innerText;
    console.log('profileText:', profileText);
    chrome.runtime.sendMessage({ action: "createResponse", profileContent: profileText });
  } else {
    console.log('profile not found');
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "createResponse") {
    console.log('message received to send to OpenAI');
    createResponse( message.profileContent );
    // testFunction(message.profileContent);
  }
});

async function testFunction(profileContent) {
  console.log('testFunction called');

  const apiKey = localStorage.getItem('apiKey');
  const userProfile = localStorage.getItem('userProfile');
  const systemPrompt = localStorage.getItem('systemPrompt');

  let tasks = JSON.parse(localStorage.getItem('tasks') || []);
  console.log('tasks:', tasks);
  const userTask = tasks.find(task => task.key === document.getElementById('taskDropdown'). value).value;
  // const userTask = tasks.[document.getElementById('taskDropdown'). value];

  console.log('key:', apiKey);
  console.log('systemPrompt:', systemPrompt);
  console.log('userTask:', userTask);
  console.log('userProfile:', userProfile);
  console.log('profileContent:', profileContent);
}

async function createResponse(profileContent) {

  console.log('sending to openai');

  const apiKey = localStorage.getItem('apiKey');

  const userProfile = localStorage.getItem('userProfile');

  const systemPrompt = localStorage.getItem('systemPrompt');

  let tasks = JSON.parse(localStorage.getItem('tasks') || []);
  console.log('tasks:', tasks);
  const userTask = tasks.find(task => task.key === document.getElementById('taskDropdown'). value).value;


  const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
  });

  const completion = await openai.chat.completions.create({
    messages: [{ 
      role: "system", 
      content: systemPrompt
    }, { 
      role: "user", 
      content: "UserTask: " + userTask + " UserProfile: " + userProfile + " ReceipientsProfile " + profileContent
    }],
    model: localStorage.getItem('model')
  });
  
  console.log("generated message: " + completion.choices[0]);
  document.getElementById('output').value = completion.choices[0].message.content;
}
