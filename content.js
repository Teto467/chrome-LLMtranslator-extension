// content.js: 各AIサービスのページで実行され、プロンプトを自動挿入し、送信する

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pastePrompt') {
    const promptText = request.prompt;
    
    // サイトごとに入力欄と送信ボタンのセレクタを定義。送信ボタンは配列で複数候補を持つ。
    const siteConfigs = {
      "chatgpt.com": {
        input: "div#prompt-textarea",
        submit: [
            "button[data-testid='send-button']",
            "button#composer-submit-button"
        ]
      },
      "gemini.google.com": {
        input: "div.ql-editor",
        submit: [
            "button[data-test-id='send-button']",
            "button:has(mat-icon[fonticon='send'])"
        ]
      },
      "claude.ai": {
        input: "div.ProseMirror",
        submit: [
            "button[aria-label='メッセージを送信']",
            "button[aria-label='Send Message']"
        ]
      },
      "www.kimi.com": {
        input: "div.chat-input-editor[data-lexical-editor='true']", 
        submit: [
            "div.send-button",
            "div:has(svg[name='Send'])"
        ]
      },
      "grok.com": {
        input: "textarea[aria-label='Grokに何でも聞いてください']",
        submit: [
            "button[aria-label='送信']",
            "button[type='submit']"
        ]
      },
      "chat.qwen.ai": {
        input: "textarea#chat-input",
        submit: [
            "button#send-message-button",
            "button[type='submit']"
        ]
      },
      "chat.deepseek.com": {
        input: "textarea#chat-input",
        submit: [
            "div[class*='_7436101'][role='button']", 
            "div[role='button']"
        ]
      }
    };

    const host = window.location.hostname;
    const configKey = Object.keys(siteConfigs).find(key => host.includes(key));
    const config = configKey ? siteConfigs[configKey] : null;

    if (!config) {
        console.warn(`${host} に対応する設定が定義されていません。`);
        sendResponse({ success: false, error: 'Config not defined' });
        return true;
    }

    // 送信ボタンをクリックする関数
    const tryClickSubmit = (attemptsLeft) => {
        if (attemptsLeft === 0) {
            console.error(`${host} の送信ボタンが見つからないか、無効化されたままです。`);
            return;
        }

        let submitButton = null;
        for (const selector of config.submit) {
            const button = document.querySelector(selector);
            if (button && button.disabled !== true && button.getAttribute('aria-disabled') !== 'true') {
                submitButton = button;
                break;
            }
        }

        if (submitButton) {
            submitButton.click();
            console.log('プロンプトを自動送信しました。');
        } else {
            setTimeout(() => tryClickSubmit(attemptsLeft - 1), 500);
        }
    };

    // 入力欄が見つかるまで一定時間試行する
    const tryPaste = (attemptsLeft) => {
      if (attemptsLeft === 0) {
        console.error(`${host} の入力欄が見つかりませんでした。サイトの構造が変更された可能性があります。`);
        sendResponse({ success: false, error: 'Input field not found' });
        return;
      }

      const inputElement = document.querySelector(config.input);

      if (inputElement) {
        inputElement.focus();
        
        // 入力要素のタイプに応じて処理を分岐
        if (inputElement.tagName === 'TEXTAREA') {
            // Grok, Qwen, DeepSeekのような標準的なテキストエリアの場合
            inputElement.value = promptText;
        } else if (host.includes("www.kimi.com")) {
            // ★ 変更: Kimi (Lexical) のために、ブラウザの選択範囲を明示的に操作してからコマンドを実行
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(inputElement);
            range.collapse(false); // カーソルを末尾に移動
            selection.removeAllRanges();
            selection.addRange(range);

            document.execCommand('insertText', false, promptText);
        } else {
            // ChatGPT, Gemini, ClaudeなどのcontentEditable div用
            const promptHTML = promptText
                .split('\n')
                .map(line => `<p>${line || '<br>'}</p>`)
                .join('');
            document.execCommand('insertHTML', false, promptHTML);
        }
        
        inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        
        console.log('プロンプトを自動挿入しました。送信を試みます...');
        sendResponse({ success: true });

        setTimeout(() => tryClickSubmit(10), 200);
      } else {
        setTimeout(() => tryPaste(attemptsLeft - 1), 500);
      }
    };

    tryPaste(10);
    return true; // 非同期でレスポンスを返すことを示す
  }
});
