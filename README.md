
# AIチャット翻訳 (AI Chat Translator)

ウェブページ上のテキストを選択し、右クリックするだけで、お好みのAIチャットサービスを使って瞬時に翻訳できるChrome拡張機能です。

-----

## ✨ 主な特徴

  * **ワンクリック翻訳**: ウェブページ上のテキストを選択して右クリックするだけで、簡単かつ迅速に翻訳を実行できます。
  * **マルチAI対応**: 複数の主要なAIチャットサービスに対応。お気に入りのサービスをいつでも切り替え可能です。
  * **プロンプトの完全カスタマイズ**: 「丁寧なビジネス日本語」「友人とのカジュアルな会話」など、翻訳のスタイル（指示プロンプト）を自由に作成・編集・保存できます。
  * **インテリジェントな自動操作**: 各AIサービスのUI構造を解析し、プロンプトの自動入力から送信までを完全自動化。ユーザーは結果を待つだけです。
  * **シームレスな設定**: オプションページでの変更はすべて自動で保存され、手間のかかる「保存」ボタンのクリックは不要です。
  * **快適なUI**: システム設定に連動するライト/ダークモードに対応した、モダンで直感的なオプションページ。

-----

## 🤖 対応AIサービス

この拡張機能は、以下のAIサービスに対応しています。

  * OpenAI (ChatGPT)
  * Google (Gemini)
  * Anthropic (Claude)
  * Moonshot AI (Kimi)
  * xAI (Grok)
  * Alibaba (Qwen/通義千問)
  * DeepSeek AI (DeepSeek)

-----

## 🚀 インストール方法

1.  このリポジトリの最新版をダウンロードし、解凍します。
2.  Chromeブラウザで、アドレスバーに `chrome://extensions` と入力して拡張機能管理ページを開きます。
3.  ページの右上にある「デベロッパー モード」をオンにします。
4.  「パッケージ化されていない拡張機能を読み込む」ボタンをクリックします。
5.  解凍したフォルダを選択します。
6.  ツールバーに拡張機能のアイコンが表示されれば、インストールは完了です。

-----

## 使い方

1.  Chromeツールバーの拡張機能アイコンを右クリックし、「オプション」を選択して設定ページを開きます。
2.  \*\*「使用するAIサービス」\*\*ドロップダウンから、翻訳に使用したいAIサービスを選択します。
3.  \*\*「翻訳モード」\*\*セクションで、右クリックメニューに表示したい翻訳のスタイル（メニュータイトルと指示プロンプト）をカスタマイズします。
4.  任意のウェブページで翻訳したいテキストを選択します。
5.  右クリックし、表示されたメニューから実行したい翻訳モードを選択します。
6.  新しいタブで選択したAIサービスが開き、プロンプトの入力から送信までが自動的に実行されます。

-----

## 🛠️ 技術的なアーキテクチャ

この拡張機能は、現代のウェブアプリケーションが持つ多様なアーキテクチャに対応するため、堅牢で適応性の高い設計を採用しています。

### Manifest V3準拠

最新のChrome拡張機能仕様に準拠し、Service Worker (`background.js`) をベースに構築されています。


## 🤝 コントリビューション

バグ報告、新機能の提案、プルリクエストを歓迎します。新しいAIサービスへの対応や、既存のセレクタの改善など、あらゆるコントリビューションがプロジェクトをより良くします。

-----

## 📜 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

