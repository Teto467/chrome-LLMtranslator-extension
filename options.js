// --- グローバル設定 ---
// ★ 変更: AIサービス名に社名とモデル名を追記
const AI_SERVICES = {
  chatgpt: { name: 'OpenAI (ChatGPT)' },
  gemini: { name: 'Google (Gemini)' },
  claude: { name: 'Anthropic (Claude)' },
  kimi: { name: 'Moonshot AI (Kimi)' },
  grok: { name: 'xAI (Grok)' },
  qwen: { name: 'Alibaba (Qwen/通義千問)' },
  deepseek: { name: 'DeepSeek AI (DeepSeek)' }
};

// --- DOM要素 ---
const modesContainer = document.getElementById('modes-container');
const themeToggle = document.getElementById('checkbox');
const serviceSelect = document.getElementById('service-select');
const addModeBtn = document.getElementById('add-mode');
const statusDiv = document.getElementById('status');

// --- イベントリスナー ---
document.addEventListener('DOMContentLoaded', initializeOptions);
addModeBtn.addEventListener('click', () => addModeUI());
themeToggle.addEventListener('change', handleThemeChange);
serviceSelect.addEventListener('change', debouncedSave); // ★ 変更: 自動保存

// --- 自動保存（デバウンス） ---
let debounceTimer;
function debouncedSave() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(saveOptions, 500); // 500msの遅延後に保存
}

// --- 初期化処理 ---
function initializeOptions() {
  populateServiceSelector();
  restoreOptions();
}

function populateServiceSelector() {
  for (const key in AI_SERVICES) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = AI_SERVICES[key].name;
    serviceSelect.appendChild(option);
  }
}

// --- テーマ管理 ---
function handleThemeChange() {
  const isDarkMode = themeToggle.checked;
  document.body.classList.toggle('dark-mode', isDarkMode);
  chrome.storage.sync.set({ darkMode: isDarkMode });
}

function applyTheme(isDarkMode) {
  themeToggle.checked = isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
}

// --- 設定の保存と復元 ---
function restoreOptions() {
  chrome.storage.sync.get({
    selectedService: 'chatgpt',
    translationModes: [],
    darkMode: false
  }, (items) => {
    applyTheme(items.darkMode);
    serviceSelect.value = items.selectedService;

    modesContainer.innerHTML = '';
    if (items.translationModes.length > 0) {
      items.translationModes.forEach(mode => addModeUI(mode, false)); // 初期読み込みでは保存しない
    } else {
      addModeUI({ title: '', prompt: '' }, false);
    }
  });
}

// ★ 変更: 保存ロジックを更新
function saveOptions() {
  const modes = [];
  const modeElements = document.querySelectorAll('.mode-item');
  modeElements.forEach(el => {
    const title = el.querySelector('.mode-title').value.trim();
    const prompt = el.querySelector('.mode-prompt').value.trim();
    if (title || prompt) { // 片方でも入力があれば保存
      modes.push({ title, prompt });
    }
  });

  const selectedService = serviceSelect.value;

  chrome.storage.sync.set({
    translationModes: modes,
    selectedService: selectedService
  }, () => {
    statusDiv.textContent = '自動保存しました';
    statusDiv.style.opacity = '1';
    setTimeout(() => { statusDiv.style.opacity = '0'; }, 2000);
  });
}

// --- UI生成 ---
// ★ 変更: 自動保存イベントを追加
function addModeUI(mode = { title: '', prompt: '' }, shouldSave = true) {
  const modeDiv = document.createElement('div');
  modeDiv.className = 'mode-item';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-mode';
  deleteButton.textContent = '削除';
  deleteButton.onclick = () => {
    modeDiv.remove();
    saveOptions(); // 即時保存
  };

  const titleLabel = document.createElement('label');
  const titleId = `title-${Date.now()}-${Math.random()}`;
  titleLabel.textContent = 'メニュータイトル:';
  titleLabel.htmlFor = titleId;

  const titleInput = document.createElement('input');
  titleInput.id = titleId;
  titleInput.type = 'text';
  titleInput.className = 'mode-title';
  titleInput.value = mode.title;
  titleInput.placeholder = '例: カジュアルな日本語';
  titleInput.addEventListener('input', debouncedSave); // ★ 変更: 自動保存

  const promptLabel = document.createElement('label');
  const promptId = `prompt-${Date.now()}-${Math.random()}`;
  promptLabel.textContent = '指示プロンプト:';
  promptLabel.htmlFor = promptId;

  const promptTextarea = document.createElement('textarea');
  promptTextarea.id = promptId;
  promptTextarea.className = 'mode-prompt';
  promptTextarea.value = mode.prompt;
  promptTextarea.placeholder = '例: 以下の文章を、親しい友人向けの自然な日本語に翻訳してください。';
  promptTextarea.addEventListener('input', debouncedSave); // ★ 変更: 自動保存

  modeDiv.appendChild(deleteButton);
  modeDiv.appendChild(titleLabel);
  modeDiv.appendChild(titleInput);
  modeDiv.appendChild(promptLabel);
  modeDiv.appendChild(promptTextarea);

  modesContainer.appendChild(modeDiv);

  if (shouldSave) {
    saveOptions(); // 新しいモードを追加したら即時保存
  }
}
