import OpenAI from "openai";

let tasks = [];
let userApiKey = "";
const THEME_STORAGE_KEY = "themePreference";
const THEME_OPTIONS = new Set(["system", "light", "dark"]);
const MODEL_OPTIONS = new Set(["gpt-5", "gpt-5-mini", "gpt-5-nano"]);
const DEFAULT_MODEL = "gpt-5-mini";

const defaultSystemPrompt = `
You write personalized LinkedIn outreach messages.

Inputs you will receive:
- Task (goal of outreach)
- Tone
- Length target
- Include CTA (yes/no)
- Include light compliment (yes/no)
- Additional context
- User profile
- Recipient profile (raw LinkedIn page text; may be noisy/duplicated)

Rules:
1. Output exactly one ready-to-send LinkedIn message and nothing else.
2. Do not use placeholders like [Name], <Company>, or generic fill-ins.
3. Use only facts supported by the provided profiles/context. Do not invent details.
4. Ignore obvious page noise (navigation text, duplicated fragments, ads, unrelated UI text).
5. Keep language natural, specific, and concise. Avoid buzzwords and over-formal phrasing.
6. If Include CTA is yes, end with a clear, low-friction call to action. If no, avoid explicit asks.
7. If Include light compliment is yes, include one brief, specific compliment grounded in recipient data.
8. Respect requested tone and length target. If length is unclear, stay in a concise outreach range.

Quality bar:
- Personalized to the recipient and aligned with the user's task.
- Clear reason for outreach.
- Professional and friendly.
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
