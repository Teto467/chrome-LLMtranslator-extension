

let translationModes = [];

// デフォルトのモード
const defaultModes = [
  { title: '丁寧なビジネス日本語', prompt: '以下の英文を、日本のビジネスシーンで通用する、プロフェッショナルで丁寧な日本語に翻訳してください。翻訳の正確性はもちろん、文化的なニュアンスも考慮に入れてください。' },
  { title: 'カジュアルな友達言葉', prompt: '以下の英文を、親しい友人に対して使うような、カジュアルで自然な日本語（タメ口）に翻訳してください。スラングや口語表現も適切に使用してください。' },
  { title: 'シンプルで分かりやすい日本語', prompt: '以下の英文を、専門用語を避け、小学生にも理解できるような、非常にシンプルで分かりやすい日本語に翻訳してください。' }
];

// 右クリックメニューを再構築する関数
function rebuildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'parent-translate',
      title: 'ChatGPTで翻訳',
      contexts: ['selection']
    });

    translationModes.forEach((mode, index) => {
      const id = `translate-mode-${index}`;
      chrome.contextMenus.create({
        id: id,
        parentId: 'parent-translate',
        title: mode.title,
        contexts: ['selection']
      });
    });
  });
}

// ストレージから設定を読み込んでメニューを初期化
function initialize() {
  chrome.storage.sync.get('translationModes', (data) => {
    // translationModes が存在しない、配列でない、または空の配列の場合はデフォルト値を使用
    if (!data.translationModes || !Array.isArray(data.translationModes) || data.translationModes.length === 0) {
      translationModes = defaultModes;
      // デフォルト値をストレージに保存し直す
      chrome.storage.sync.set({ translationModes: defaultModes });
    } else {
      translationModes = data.translationModes;
    }
    rebuildContextMenus();
  });
}

// メニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  if (!selectedText) {
    return;
  }

  const modeIndex = parseInt(info.menuItemId.replace('translate-mode-', ''));
  const selectedMode = translationModes[modeIndex];

  if (selectedMode) {
    const prompt = `${selectedMode.prompt}\n\n---\n\n${selectedText}`;
    const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
    chrome.tabs.create({ url: chatGptUrl });
  }
});

// 拡張機能のインストール時と起動時に初期化
chrome.runtime.onInstalled.addListener(initialize);
// chrome.runtime.onStartup.addListener(initialize); // ブラウザ起動時も

