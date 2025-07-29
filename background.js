// --- サービス設定 ---
const AI_SERVICES = {
  chatgpt: {
    name: 'OpenAI (ChatGPT)',
    url: 'https://chatgpt.com/',
    // ★ 変更: ChatGPTはURLクエリでのプロンプト入力をサポートするため、trueに戻します。
    // これにより、最も安定した方法で動作します。
    supportsQuery: true, 
    createQueryUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
  },
  gemini: {
    name: 'Google (Gemini)',
    url: 'https://gemini.google.com/',
    supportsQuery: false
  },
  claude: {
    name: 'Anthropic (Claude)',
    url: 'https://claude.ai/new',
    supportsQuery: false
  },
  kimi: {
    name: 'Moonshot AI (Kimi)',
    url: 'https://www.kimi.com/',
    supportsQuery: false
  },
  grok: {
    name: 'xAI (Grok)',
    url: 'https://grok.com/',
    supportsQuery: false
  },
  qwen: {
    name: 'Alibaba (Qwen/通義千問)',
    url: 'https://chat.qwen.ai/',
    supportsQuery: false
  },
  deepseek: {
    name: 'DeepSeek AI (DeepSeek)',
    url: 'https://chat.deepseek.com/',
    supportsQuery: false
  }
};

// デフォルトの翻訳モード
const defaultModes = [
  { title: '丁寧なビジネス日本語', prompt: '以下の英文を、日本のビジネスシーンで通用する、プロフェッショナルで丁寧な日本語に翻訳してください。翻訳の正確性はもちろん、文化的なニュアンスも考慮に入れてください。' },
  { title: 'カジュアルな友達言葉', prompt: '以下の英文を、親しい友人に対して使うような、カジュアルで自然な日本語（タメ口）に翻訳してください。スラングや口語表現も適切に使用してください。' },
  { title: 'シンプルで分かりやすい日本語', prompt: '以下の英文を、専門用語を避け、小学生にも理解できるような、非常にシンプルで分かりやすい日本語に翻訳してください。' }
];

// --- 初期化とイベントリスナー ---
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.translationModes || changes.selectedService)) {
    initialize();
  }
});
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// --- 関数定義 ---

// ★ 修正: 競合状態によるエラーを防ぐため、初期化処理を管理
let isInitializing = false;
async function initialize() {
  if (isInitializing) {
    console.log("初期化処理が実行中のため、新規の処理をスキップします。");
    return;
  }
  isInitializing = true;

  try {
    const data = await chrome.storage.sync.get(['translationModes', 'selectedService']);
    let modes = (data.translationModes && data.translationModes.length > 0) ? data.translationModes : defaultModes;
    
    if (!data.translationModes || data.translationModes.length === 0) {
      await chrome.storage.sync.set({ translationModes: defaultModes });
      modes = defaultModes; // 変数を更新
    }

    const serviceKey = data.selectedService || 'chatgpt';
    const serviceName = AI_SERVICES[serviceKey]?.name || 'ChatGPT';
    await rebuildContextMenus(modes, serviceName);
  } catch (error) {
    console.error("コンテキストメニューの初期化中にエラーが発生しました:", error);
  } finally {
    isInitializing = false;
  }
}

// ★ 修正: async/await を使用して、処理が完了するのを待つように変更
async function rebuildContextMenus(modes, serviceName) {
  // 既存のメニューをすべて削除し、完了を待つ
  await chrome.contextMenus.removeAll();

  // メインの親メニューを作成
  await chrome.contextMenus.create({
    id: 'parent-translate',
    title: `${serviceName}で翻訳`,
    contexts: ['selection']
  });

  // 各翻訳モードのサブメニューを作成
  for (const [index, mode] of modes.entries()) {
    if (mode.title) {
      await chrome.contextMenus.create({
        id: `translate-mode-${index}`,
        parentId: 'parent-translate',
        title: mode.title,
        contexts: ['selection']
      });
    }
  }
}

async function handleContextMenuClick(info, tab) {
  if (!info.selectionText) return;
  const modeIndexStr = info.menuItemId.replace('translate-mode-', '');
  const modeIndex = parseInt(modeIndexStr, 10);
  if (isNaN(modeIndex)) return;

  const data = await chrome.storage.sync.get(['translationModes', 'selectedService']);
  const modes = (data.translationModes && data.translationModes.length > 0) ? data.translationModes : defaultModes;
  const serviceKey = data.selectedService || 'chatgpt';
  const service = AI_SERVICES[serviceKey];
  const selectedMode = modes[modeIndex];

  if (!service || !selectedMode) return;

  const fullPrompt = `${selectedMode.prompt}\n\n---\n\n${info.selectionText}`;

  if (service.supportsQuery && service.createQueryUrl) {
    const url = service.createQueryUrl(fullPrompt);
    chrome.tabs.create({ url });
  } else {
    // 自動入力ロジック
    // ★ 修正: chrome:// や about: などの保護されたページではスクリプトを実行しない
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => navigator.clipboard.writeText(text),
        args: [fullPrompt]
      }).catch(e => console.error("クリップボードへのコピーに失敗（スクリプト実行時）:", e));
    }

    const newTab = await chrome.tabs.create({ url: service.url, active: true });

    const listener = (tabId, changeInfo, tab) => {
      if (tabId === newTab.id && changeInfo.status === 'complete' && tab.url.startsWith(service.url)) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'pastePrompt',
            prompt: fullPrompt
          }).catch(error => {
            console.error(`プロンプトの自動挿入に失敗しました (${service.name}):`, error);
            console.log("クリップボードからの手動貼り付けをお試しください。");
          });
        }, 1200); 
        chrome.tabs.onUpdated.removeListener(listener);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  }
}
