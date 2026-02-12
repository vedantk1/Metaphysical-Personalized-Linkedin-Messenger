import OpenAI from "openai";

let tasks = [];
let userApiKey = "";

const THEME_STORAGE_KEY = "themePreference";
const THEME_OPTIONS = new Set(["system", "light", "dark"]);
const MODEL_OPTIONS = new Set(["gpt-5", "gpt-5-mini", "gpt-5-nano"]);
const DEFAULT_MODEL = "gpt-5-mini";
const LINKEDIN_PROFILE_URL = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\//i;

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
  setSettingsStatus("Changes are saved automatically.", "info");
});

function loadSavedSettings() {
  const savedProfile = localStorage.getItem("userProfile") || "";
  const savedApiKey = localStorage.getItem("apiKey") || "";
  const savedSystemPrompt = localStorage.getItem("systemPrompt") || "";
  const savedTasks = readTasks();

  const profileInput = document.getElementById("userProfile");
  const apiInput = document.getElementById("openAiApiInput");
  const systemPromptInput = document.getElementById("systemPrompt");

  profileInput.value = savedProfile;
  apiInput.value = savedApiKey;
  userApiKey = savedApiKey;

  if (savedSystemPrompt.trim()) {
    systemPromptInput.value = savedSystemPrompt;
  } else {
    const seededPrompt = defaultSystemPrompt.trim();
    systemPromptInput.value = seededPrompt;
    localStorage.setItem("systemPrompt", seededPrompt);
  }

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.value = getSavedTheme();
  }

  tasks = savedTasks;
  renderTasks();
}

function bindEvents() {
  const loadUserProfileButton = document.getElementById("loadUserProfile");
  loadUserProfileButton.dataset.defaultLabel = loadUserProfileButton.textContent;

  document.getElementById("openAiApiInput").addEventListener("input", (event) => {
    userApiKey = event.target.value.trim();
    setSettingsStatus("Saving changes...", "info");
    persistSettingsDebounced();
  });

  document.getElementById("userProfile").addEventListener("input", () => {
    setSettingsStatus("Saving changes...", "info");
    persistSettingsDebounced();
  });

  document.getElementById("systemPrompt").addEventListener("input", () => {
    setSettingsStatus("Saving changes...", "info");
    persistSettingsDebounced();
  });

  document.getElementById("toggleApiVisibility").addEventListener("click", () => {
    const input = document.getElementById("openAiApiInput");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    document.getElementById("toggleApiVisibility").textContent = isPassword ? "Hide" : "Show";
  });

  document.getElementById("loadUserProfile").addEventListener("click", () => {
    loadProfileFromActiveTab();
  });

  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "popup.html";
  });

  document.getElementById("addTaskButton").addEventListener("click", () => {
    const taskKey = document.getElementById("newTaskKey").value.trim();
    const taskValue = document.getElementById("newTaskValue").value.trim();

    if (!taskKey || !taskValue) {
      setSettingsStatus("Task name and description are required.", "error");
      return;
    }

    tasks.push({ key: taskKey, value: taskValue });
    document.getElementById("newTaskKey").value = "";
    document.getElementById("newTaskValue").value = "";
    renderTasks();
    persistSettings({ message: "Task saved." });
  });

  document.getElementById("removeAllTasksButton").addEventListener("click", () => {
    tasks = [];
    renderTasks();
    persistSettings({ message: "All tasks removed." });
  });

  document.getElementById("default-system-prompt-button").addEventListener("click", () => {
    document.getElementById("systemPrompt").value = defaultSystemPrompt.trim();
    persistSettings({ message: "Default system prompt restored." });
  });

  document.getElementById("themeSelect").addEventListener("change", (event) => {
    const theme = THEME_OPTIONS.has(event.target.value) ? event.target.value : "system";
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
    persistSettings({ message: "Theme updated." });
  });
}

const persistSettingsDebounced = debounce(() => {
  persistSettings({ message: "Changes saved automatically." });
}, 220);

function persistSettings(options = {}) {
  const { silent = false, message = "Changes saved automatically.", type = "success" } = options;

  userApiKey = document.getElementById("openAiApiInput").value.trim();
  localStorage.setItem("apiKey", userApiKey);
  localStorage.setItem("userProfile", document.getElementById("userProfile").value.trim());
  localStorage.setItem("systemPrompt", document.getElementById("systemPrompt").value.trim());
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem(THEME_STORAGE_KEY, getSavedTheme());

  if (!silent) {
    setSettingsStatus(message, type);
  }
}

async function loadProfileFromActiveTab() {
  const loadButton = document.getElementById("loadUserProfile");
  setButtonBusy(loadButton, true, "Loading profile...");
  setSettingsStatus("Reading profile text from active LinkedIn tab...", "info");

  try {
    const activeTab = await getActiveTab();
    if (!activeTab || !activeTab.id) {
      throw new Error("No active tab found.");
    }

    if (!isLinkedInProfileUrl(activeTab.url)) {
      setSettingsStatus("Open a LinkedIn profile URL (linkedin.com/in/...) in the active tab.", "error");
      return;
    }

    const rawProfile = await extractTextFromTab(activeTab.id);
    if (!rawProfile) {
      setSettingsStatus("Could not extract text from the active profile page. Scroll and try again.", "error");
      return;
    }

    document.getElementById("userProfile").value = rawProfile;
    persistSettings({ silent: true });

    if (!userApiKey) {
      setSettingsStatus("Raw profile loaded. Add an API key if you want automatic cleanup.", "success");
      return;
    }

    setButtonBusy(loadButton, true, "Cleaning profile...");
    setSettingsStatus("Cleaning profile with OpenAI...", "info");

    const cleanedProfile = await cleanProfile(rawProfile);
    if (!cleanedProfile) {
      setSettingsStatus("Raw profile loaded. Cleanup returned no text.", "error");
      return;
    }

    document.getElementById("userProfile").value = cleanedProfile;
    persistSettings({ silent: true });
    setSettingsStatus("Profile loaded and cleaned.", "success");
  } catch (error) {
    console.error("Profile load failed:", error);
    setSettingsStatus(`Failed to load profile: ${error.message}`, "error");
  } finally {
    setButtonBusy(loadButton, false);
  }
}

async function cleanProfile(profileContent) {
  const openai = new OpenAI({
    apiKey: userApiKey,
    dangerouslyAllowBrowser: true
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "The user will provide the parsed html innerText of their entire linkedin profile webpage. The text will be full of duplications an irrelevant content. Your job is to filter through the useless content and summarize the important text."
      },
      {
        role: "user",
        content: profileContent
      }
    ],
    model: localStorage.getItem("model") || DEFAULT_MODEL
  });

  return completion.choices[0]?.message?.content?.trim() || "";
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
      persistSettings({ message: "Task removed." });
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

function ensureValidModelPreference() {
  const model = localStorage.getItem("model");
  if (!MODEL_OPTIONS.has(model)) {
    localStorage.setItem("model", DEFAULT_MODEL);
  }
}

function setSettingsStatus(message, type = "info") {
  const status = document.getElementById("settingsStatus");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.classList.remove("info", "success", "error");
  status.classList.add(type);
}

function setButtonBusy(button, isBusy, busyText = "") {
  if (!button) {
    return;
  }

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }

  button.disabled = isBusy;
  button.classList.toggle("busy-button", isBusy);
  button.textContent = isBusy ? busyText : button.dataset.defaultLabel;
}

function readTasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem("tasks") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function isLinkedInProfileUrl(url) {
  return typeof url === "string" && LINKEDIN_PROFILE_URL.test(url);
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tabs[0]);
    });
  });
}

function extractTextFromTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => (document.body ? document.body.innerText : "")
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const text = results?.[0]?.result;
        resolve(typeof text === "string" ? text.trim() : "");
      }
    );
  });
}

function debounce(callback, waitMs) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, waitMs);
  };
}
