import OpenAI from "openai";

const DEFAULTS = {
  model: "gpt-5-mini",
  tone: "Professional",
  length: "Short",
  includeCta: true,
  includeCompliment: false
};

const THEME_OPTIONS = new Set(["system", "light", "dark"]);
const MODEL_OPTIONS = new Set(["gpt-5", "gpt-5-mini", "gpt-5-nano"]);
const LINKEDIN_PROFILE_URL = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\//i;

const LENGTH_GUIDANCE = {
  Short: "1-3 concise sentences",
  Medium: "4-6 sentences with a bit more detail",
  Long: "7-9 sentences with a strong narrative"
};

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getSavedTheme());
  loadTasks();
  hydratePreferences();
  renderHistory();
  bindEvents();

  const mainButton = document.getElementById("mainButton");
  mainButton.dataset.defaultLabel = mainButton.textContent;

  setStatus("Ready to generate.", "info");
});

function bindEvents() {
  document.getElementById("settingsButton").addEventListener("click", () => {
    window.location.href = "settings.html";
  });

  document.getElementById("mainButton").addEventListener("click", () => {
    startGeneration();
  });

  document.getElementById("modelDropdown").addEventListener("change", (event) => {
    const nextModel = MODEL_OPTIONS.has(event.target.value) ? event.target.value : DEFAULTS.model;
    event.target.value = nextModel;
    localStorage.setItem("model", nextModel);
  });

  document.getElementById("toneDropdown").addEventListener("change", (event) => {
    localStorage.setItem("tone", event.target.value);
  });

  document.getElementById("lengthDropdown").addEventListener("change", (event) => {
    localStorage.setItem("length", event.target.value);
  });

  document.getElementById("includeCta").addEventListener("change", (event) => {
    localStorage.setItem("includeCta", String(event.target.checked));
  });

  document.getElementById("includeCompliment").addEventListener("change", (event) => {
    localStorage.setItem("includeCompliment", String(event.target.checked));
  });

  document.getElementById("copyButton").addEventListener("click", async () => {
    const output = document.getElementById("output").value.trim();
    if (!output) {
      setStatus("Nothing to copy yet.", "error");
      return;
    }

    await navigator.clipboard.writeText(output);
    setStatus("Message copied to clipboard.", "success");
  });

  document.getElementById("clearButton").addEventListener("click", () => {
    document.getElementById("output").value = "";
    document.getElementById("additionalContext").value = "";
    setStatus("Cleared output and notes.", "info");
  });

  document.getElementById("saveButton").addEventListener("click", () => {
    const output = document.getElementById("output").value.trim();
    if (!output) {
      setStatus("Generate a message before saving.", "error");
      return;
    }

    saveToHistory(output);
    renderHistory();
    setStatus("Saved to history.", "success");
  });

  document.getElementById("clearHistoryButton").addEventListener("click", () => {
    localStorage.setItem("messageHistory", JSON.stringify([]));
    renderHistory();
    setStatus("History cleared.", "info");
  });

  document.getElementById("historyList").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-history-index]");
    if (!button) {
      return;
    }

    const index = Number(button.dataset.historyIndex);
    const history = getHistory();
    if (!history[index]) {
      return;
    }

    await navigator.clipboard.writeText(history[index].message);
    setStatus("History message copied.", "success");
  });
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const taskDropdown = document.getElementById("taskDropdown");
  taskDropdown.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "default";
  placeholder.text = "Select task";
  taskDropdown.appendChild(placeholder);

  tasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = task.key;
    option.text = task.key;
    taskDropdown.appendChild(option);
  });
}

function hydratePreferences() {
  const savedModel = localStorage.getItem("model");
  const model = MODEL_OPTIONS.has(savedModel) ? savedModel : DEFAULTS.model;
  const tone = localStorage.getItem("tone") || DEFAULTS.tone;
  const length = localStorage.getItem("length") || DEFAULTS.length;
  const includeCta = localStorage.getItem("includeCta");
  const includeCompliment = localStorage.getItem("includeCompliment");

  localStorage.setItem("model", model);
  localStorage.setItem("tone", tone);
  localStorage.setItem("length", length);

  if (includeCta === null) {
    localStorage.setItem("includeCta", String(DEFAULTS.includeCta));
  }
  if (includeCompliment === null) {
    localStorage.setItem("includeCompliment", String(DEFAULTS.includeCompliment));
  }

  document.getElementById("modelDropdown").value = model;
  document.getElementById("toneDropdown").value = tone;
  document.getElementById("lengthDropdown").value = length;
  document.getElementById("includeCta").checked = localStorage.getItem("includeCta") === "true";
  document.getElementById("includeCompliment").checked =
    localStorage.getItem("includeCompliment") === "true";
}

function setStatus(message, type = "info") {
  const status = document.getElementById("statusMessage");
  status.textContent = message;
  status.classList.remove("info", "success", "error");
  status.classList.add(type);
}

function setLoading(isLoading, buttonText = "Generating...") {
  const mainButton = document.getElementById("mainButton");
  const copyButton = document.getElementById("copyButton");
  const saveButton = document.getElementById("saveButton");
  const clearButton = document.getElementById("clearButton");

  mainButton.disabled = isLoading;
  copyButton.disabled = isLoading;
  saveButton.disabled = isLoading;
  clearButton.disabled = isLoading;

  mainButton.classList.toggle("busy-button", isLoading);
  mainButton.textContent = isLoading ? buttonText : mainButton.dataset.defaultLabel;
}

async function startGeneration() {
  const validationMessage = getGenerationValidationMessage();
  if (validationMessage) {
    setStatus(validationMessage, "error");
    return;
  }

  setLoading(true, "Loading profile...");
  setStatus("Reading LinkedIn profile from the active tab...", "info");

  try {
    const activeTab = await getActiveTab();
    if (!activeTab || !activeTab.id) {
      throw new Error("No active tab found.");
    }

    if (!isLinkedInProfileUrl(activeTab.url)) {
      setStatus("Open a LinkedIn profile URL (linkedin.com/in/...) in the active tab.", "error");
      return;
    }

    const profileText = await extractTextFromTab(activeTab.id);
    if (!profileText) {
      setStatus("Could not read text from the active LinkedIn profile. Scroll and try again.", "error");
      return;
    }

    setLoading(true, "Generating...");
    await createResponse(profileText);
  } catch (error) {
    console.error("Generation failed:", error);
    setStatus(`Unable to generate message: ${error.message}`, "error");
  } finally {
    setLoading(false);
  }
}

function getGenerationValidationMessage() {
  const apiKey = localStorage.getItem("apiKey") || "";
  const profile = localStorage.getItem("userProfile") || "";
  const systemPrompt = localStorage.getItem("systemPrompt") || "";
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const selectedTask = document.getElementById("taskDropdown").value;

  if (!apiKey.trim()) {
    return "Missing API key. Add it in Settings.";
  }

  if (!profile.trim()) {
    return "Missing your LinkedIn profile context. Load or paste it in Settings.";
  }

  if (!systemPrompt.trim()) {
    return "Missing system prompt. Restore or edit it in Settings.";
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return "No tasks found. Add at least one task in Settings.";
  }

  if (selectedTask === "default") {
    return "Select a task before generating.";
  }

  return "";
}

async function createResponse(profileContent) {
  const apiKey = localStorage.getItem("apiKey");
  const userProfile = localStorage.getItem("userProfile");
  const systemPrompt = localStorage.getItem("systemPrompt");
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

  const taskKey = document.getElementById("taskDropdown").value;
  const selectedTask = tasks.find((task) => task.key === taskKey);

  if (!selectedTask) {
    throw new Error("Selected task no longer exists. Re-open Settings and add/select a task.");
  }

  const tone = document.getElementById("toneDropdown").value;
  const length = document.getElementById("lengthDropdown").value;
  const includeCta = document.getElementById("includeCta").checked;
  const includeCompliment = document.getElementById("includeCompliment").checked;
  const additionalContext = document.getElementById("additionalContext").value.trim();

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const userMessage = `
Task: ${selectedTask.value}
Tone: ${tone}
Length: ${length} (${LENGTH_GUIDANCE[length]})
Include CTA: ${includeCta ? "Yes" : "No"}
Include light compliment: ${includeCompliment ? "Yes" : "No"}
Additional context: ${additionalContext || "None"}

User profile:
${userProfile}

Recipient profile:
${profileContent}

Write the message only. Avoid placeholders.`;

  setStatus("Generating message...", "info");

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    model: localStorage.getItem("model") || DEFAULTS.model
  });

  const message = completion.choices[0]?.message?.content?.trim() || "";
  if (!message) {
    throw new Error("Model returned an empty message.");
  }

  document.getElementById("output").value = message;
  setStatus("Message generated. Review or save to history.", "success");
}

function saveToHistory(message) {
  const history = getHistory();
  const entry = {
    message,
    task: document.getElementById("taskDropdown").value,
    tone: document.getElementById("toneDropdown").value,
    length: document.getElementById("lengthDropdown").value,
    model: document.getElementById("modelDropdown").value,
    createdAt: new Date().toISOString()
  };

  history.unshift(entry);
  localStorage.setItem("messageHistory", JSON.stringify(history.slice(0, 5)));
}

function getHistory() {
  return JSON.parse(localStorage.getItem("messageHistory") || "[]");
}

function renderHistory() {
  const history = getHistory();
  const container = document.getElementById("historyList");
  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = `<p class="empty-state">No history yet. Save a message to see it here.</p>`;
    return;
  }

  history.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "history-card";

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = `${item.task} • ${item.tone} • ${item.length}`;

    const message = document.createElement("p");
    message.className = "history-message";
    message.textContent = item.message;

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "ghost-button small";
    copyButton.textContent = "Copy";
    copyButton.dataset.historyIndex = String(index);

    actions.appendChild(copyButton);
    wrapper.appendChild(meta);
    wrapper.appendChild(message);
    wrapper.appendChild(actions);
    container.appendChild(wrapper);
  });
}

function getSavedTheme() {
  const theme = localStorage.getItem("themePreference");
  return THEME_OPTIONS.has(theme) ? theme : "system";
}

function applyTheme(theme) {
  const normalizedTheme = THEME_OPTIONS.has(theme) ? theme : "system";
  document.body.classList.remove("theme-system", "theme-light", "theme-dark");
  document.body.classList.add(`theme-${normalizedTheme}`);
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
