// --- サービス設定 ---
// ★ 変更: AIサービス名に社名とモデル名を追記
const AI_SERVICES = {
  chatgpt: {
    name: 'OpenAI (ChatGPT)',
    url: 'https://chatgpt.com/',
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

// 拡張機能のインストール時と起動時に初期化
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

// 設定が変更されたときにメニューを再構築
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.translationModes || changes.selectedService)) {
    initialize();
  }
});

// コンテキストメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);


// --- 関数定義 ---

// 初期化処理：ストレージから設定を読み込み、メニューを構築
function initialize() {
  chrome.storage.sync.get(['translationModes', 'selectedService'], (data) => {
    const modes = (data.translationModes && data.translationModes.length > 0)
      ? data.translationModes
      : defaultModes;
    
    // ストレージにモードが存在しない場合はデフォルト値を保存
    if (!data.translationModes || data.translationModes.length === 0) {
      chrome.storage.sync.set({ translationModes: defaultModes });
    }
    
    const serviceKey = data.selectedService || 'chatgpt';
    const serviceName = AI_SERVICES[serviceKey]?.name || 'ChatGPT';
    
    rebuildContextMenus(modes, serviceName);
  });
}

// コンテキストメニューを再構築
function rebuildContextMenus(modes, serviceName) {
  chrome.contextMenus.removeAll(() => {
    // 親メニュー
    chrome.contextMenus.create({
      id: 'parent-translate',
      title: `${serviceName}で翻訳`,
      contexts: ['selection']
    });

    // 子メニュー（各翻訳モード）
    modes.forEach((mode, index) => {
      // タイトルが空の場合はメニュー項目を作成しない
      if (mode.title) {
          chrome.contextMenus.create({
            id: `translate-mode-${index}`,
            parentId: 'parent-translate',
            title: mode.title,
            contexts: ['selection']
          });
      }
    });
  });
}

// メニュークリック時のハンドラ
async function handleContextMenuClick(info, tab) {
  if (!info.selectionText) return;

  const modeIndexStr = info.menuItemId.replace('translate-mode-', '');
  const modeIndex = parseInt(modeIndexStr, 10);
  if (isNaN(modeIndex)) return;

  // 最新の設定をストレージから取得
  const data = await chrome.storage.sync.get(['translationModes', 'selectedService']);
  const modes = (data.translationModes && data.translationModes.length > 0) ? data.translationModes : defaultModes;
  const serviceKey = data.selectedService || 'chatgpt';
  const service = AI_SERVICES[serviceKey];
  const selectedMode = modes[modeIndex];

  if (!service || !selectedMode) {
    console.error('選択されたサービスまたはモードが見つかりません。');
    return;
  }

  const fullPrompt = `${selectedMode.prompt}\n\n---\n\n${info.selectionText}`;

  if (service.supportsQuery && service.createQueryUrl) {
    // URLクエリをサポートしている場合
    const url = service.createQueryUrl(fullPrompt);
    chrome.tabs.create({ url });
  } else {
    // URLクエリをサポートしていない場合 (クリップボード経由)
    try {
      // 現在のタブにスクリプトを注入してクリップボードにコピー
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: copyToClipboard,
        args: [fullPrompt]
      });
      // サービスのURLを新しいタブで開く
      chrome.tabs.create({ url: service.url });
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err);
      // エラーが発生した場合でも、とりあえずサイトは開く
      chrome.tabs.create({ url: service.url });
    }
  }
}

// ブラウザのページコンテキストで実行される関数
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => console.log('プロンプトをクリップボードにコピーしました。'))
    .catch(err => console.error('クリップボードへの書き込みに失敗:', err));
}
