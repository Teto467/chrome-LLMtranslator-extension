document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('add-mode').addEventListener('click', () => addModeUI());
document.getElementById('save-modes').addEventListener('click', saveOptions);

const modesContainer = document.getElementById('modes-container');
const themeToggle = document.getElementById('checkbox');

// --- Theme Management ---
themeToggle.addEventListener('change', () => {
  const isDarkMode = themeToggle.checked;
  document.body.classList.toggle('dark-mode', isDarkMode);
  chrome.storage.sync.set({ darkMode: isDarkMode });
});

function applyTheme(isDarkMode) {
  themeToggle.checked = isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
}

// --- Options Management ---

// Load saved modes and theme from storage
function restoreOptions() {
  chrome.storage.sync.get({
    translationModes: [],
    darkMode: false // Default to light mode
  }, (items) => {
    // Apply theme first
    applyTheme(items.darkMode);

    // Clear existing UI and rebuild
    modesContainer.innerHTML = '';
    if (items.translationModes.length > 0) {
      items.translationModes.forEach(addModeUI);
    } else {
      // If no modes are saved, add one empty one to start
      addModeUI();
    }
  });
}

// Save all current modes to storage
function saveOptions() {
  const modes = [];
  const modeElements = document.querySelectorAll('.mode-item');
  modeElements.forEach(el => {
    const title = el.querySelector('.mode-title').value.trim();
    const prompt = el.querySelector('.mode-prompt').value.trim();
    if (title && prompt) {
      modes.push({ title, prompt });
    }
  });

  chrome.storage.sync.set({
    translationModes: modes
  }, () => {
    const status = document.getElementById('status');
    status.textContent = '設定を保存しました。';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
}

// Add a new UI block for a mode
function addModeUI(mode = { title: '', prompt: '' }) {
  const modeDiv = document.createElement('div');
  modeDiv.className = 'mode-item';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-mode';
  deleteButton.textContent = '削除';
  deleteButton.onclick = () => {
    modeDiv.remove();
  };

  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'メニュータイトル:';
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'mode-title';
  titleInput.value = mode.title;
  titleInput.placeholder = '例: カジュアルな日本語';

  const promptLabel = document.createElement('label');
  promptLabel.textContent = '指示プロンプト:';
  const promptTextarea = document.createElement('textarea');
  promptTextarea.className = 'mode-prompt';
  promptTextarea.value = mode.prompt;
  promptTextarea.placeholder = '例: 以下の文章を、親しい友人向けの自然な日本語に翻訳してください。';

  modeDiv.appendChild(deleteButton);
  modeDiv.appendChild(titleLabel);
  modeDiv.appendChild(titleInput);
  modeDiv.appendChild(promptLabel);
  modeDiv.appendChild(promptTextarea);

  modesContainer.appendChild(modeDiv);
}