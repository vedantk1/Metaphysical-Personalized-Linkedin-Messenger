import OpenAI from "openai";

let tasks = [];
let userApiKey = "";
const THEME_STORAGE_KEY = "themePreference";
const THEME_OPTIONS = new Set(["system", "light", "dark"]);
const MODEL_OPTIONS = new Set(["gpt-5", "gpt-5-mini", "gpt-5-nano"]);
const DEFAULT_MODEL = "gpt-5-mini";

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

document.addEventListener("DOMContentLoaded", () => {
  ensureValidModelPreference();
  applyTheme(getSavedTheme());
  loadSavedSettings();
  bindEvents();
});

function loadSavedSettings() {
  const savedProfile = localStorage.getItem("userProfile");
  const savedApiKey = localStorage.getItem("apiKey");
  const savedSystemPrompt = localStorage.getItem("systemPrompt");
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

  if (savedProfile) {
    document.getElementById("userProfile").value = savedProfile;
  }

  if (savedApiKey) {
    document.getElementById("openAiApiInput").value = savedApiKey;
    userApiKey = savedApiKey;
  }

  if (savedSystemPrompt) {
    document.getElementById("systemPrompt").value = savedSystemPrompt;
  }

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.value = getSavedTheme();
  }

  tasks = savedTasks;
  renderTasks();
}

function bindEvents() {
  document.getElementById("openAiApiInput").addEventListener("input", (event) => {
    userApiKey = event.target.value.trim();
    localStorage.setItem("apiKey", userApiKey);
  });

  document.getElementById("userProfile").addEventListener("input", (event) => {
    localStorage.setItem("userProfile", event.target.value.trim());
  });

  document.getElementById("systemPrompt").addEventListener("input", (event) => {
    localStorage.setItem("systemPrompt", event.target.value.trim());
  });

  document.getElementById("toggleApiVisibility").addEventListener("click", () => {
    const input = document.getElementById("openAiApiInput");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    document.getElementById("toggleApiVisibility").textContent = isPassword ? "Hide" : "Show";
  });

  document.getElementById("loadUserProfile").addEventListener("click", () => {
    if (!userApiKey) {
      alert("Please enter your OpenAI API key");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          const profileText = document.body ? document.body.innerText : "";
          chrome.runtime.sendMessage({ action: "parsedUserProfile", profileContent: profileText });
        }
      });
    });
  });

  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "popup.html";
  });

  document.getElementById("addTaskButton").addEventListener("click", () => {
    const taskKey = document.getElementById("newTaskKey").value.trim();
    const taskValue = document.getElementById("newTaskValue").value.trim();

    if (taskKey && taskValue) {
      tasks.push({ key: taskKey, value: taskValue });
      document.getElementById("newTaskKey").value = "";
      document.getElementById("newTaskValue").value = "";
      renderTasks();
      persistTasks();
    }
  });

  document.getElementById("removeAllTasksButton").addEventListener("click", () => {
    tasks = [];
    renderTasks();
    persistTasks();
  });

  document.getElementById("default-system-prompt-button").addEventListener("click", () => {
    document.getElementById("systemPrompt").value = defaultSystemPrompt;
    localStorage.setItem("systemPrompt", defaultSystemPrompt.trim());
  });

  document.getElementById("themeSelect").addEventListener("change", (event) => {
    const theme = THEME_OPTIONS.has(event.target.value) ? event.target.value : "system";
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "parsedUserProfile") {
    cleanProfile(message.profileContent);
  }
});

async function cleanProfile(profileContent) {
  const apiKey = userApiKey;

  const systemPrompt =
    "The user will provide the parsed html innerText of their entire linkedin profile webpage. The text will be full of duplications an irrelevant content. Your job is to filter through the useless content and summarize the important text.";
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: profileContent
      }
    ],
    model: localStorage.getItem("model") || DEFAULT_MODEL
  });

  const cleanedProfile = completion.choices[0]?.message?.content || "";
  document.getElementById("userProfile").value = cleanedProfile;
  localStorage.setItem("userProfile", cleanedProfile.trim());
}

function renderTasks() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `<p class="empty-state">No tasks saved yet. Add one below.</p>`;
    return;
  }

  tasks.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = "task-row";

    const taskName = document.createElement("p");
    taskName.textContent = task.key;

    const taskDescription = document.createElement("p");
    taskDescription.textContent = task.value;
    taskDescription.title = task.value;
    taskDescription.className = "truncated";

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      tasks.splice(index, 1);
      renderTasks();
      persistTasks();
    });

    row.appendChild(taskName);
    row.appendChild(taskDescription);
    row.appendChild(removeButton);
    taskList.appendChild(row);
  });
}

function getSavedTheme() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return THEME_OPTIONS.has(theme) ? theme : "system";
}

function applyTheme(theme) {
  const normalizedTheme = THEME_OPTIONS.has(theme) ? theme : "system";
  document.body.classList.remove("theme-system", "theme-light", "theme-dark");
  document.body.classList.add(`theme-${normalizedTheme}`);
}

function persistTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function ensureValidModelPreference() {
  const model = localStorage.getItem("model");
  if (!MODEL_OPTIONS.has(model)) {
    localStorage.setItem("model", DEFAULT_MODEL);
  }
}
