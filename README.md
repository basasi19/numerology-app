# 数秘術鑑定アプリ

名前の読みと生年月日から鑑定結果を表示する、静的なWebアプリです。

公開URL: https://basasi19.github.io/numerology-app/

## 使い方

1. 出生時の姓・名をひらがなで入力し、生年月日を選びます。表示名は任意です。
2. 「鑑定結果を表示」で結果を表示します。
3. 「資料 · 数字の意味」で資料に切り替えられます。
4. 「PDFに保存」で案内を開き、印刷画面でPDF保存を選びます。

入力内容はアプリのメモリ内だけで扱い、保存・送信・アクセス解析は行いません。再読み込みやタブを閉じると入力は消えます。Webページ自体の配信にはGitHub Pagesを利用します。

## ローカルで使う

このフォルダー全体をダウンロードし、`index.html` をChromeまたはEdgeで開きます。サーバー、ビルド、外部ライブラリは不要です。

## ファイル

- `index.html`: 入力画面と資料画面
- `styles.css`: 画面・スマートフォン・印刷レイアウト
- `core.js`: ローマ字変換と数値計算
- `app.js`: 結果表示・画面切り替え・印刷
- `meanings.js`: 数字の意味
- `plant-lifecycle.png`: 植物イラスト
- `.nojekyll`: 静的ファイルをそのまま配信

## Web版の更新

GitHubのこのリポジトリの `main` ブランチを更新すると、GitHub Pagesへ自動反映されます。

ブラウザでは「Add file」→「Upload files」で変更したファイルをアップロードし、「Commit changes」で保存します。植物画像もルートの `plant-lifecycle.png` を更新してください。

元のPC版を修正した場合は、`dist` フォルダーの**中身**を、このリポジトリのルートと対応する場所へ反映してください。`dist` フォルダーそのものをルートへ追加する方法ではWeb版は更新されません。元の `dist/assets/plant-lifecycle.png` は公開版ではルートの `plant-lifecycle.png` に配置し、`app.js` の画像参照2か所も `plant-lifecycle.png` にしてください。

公開設定は Settings → Pages → Source: **Deploy from a branch**、Branch: **main**、Folder: **/(root)** です。反映状況はActionsで確認できます。

`.env`、APIキー、パスワード、入力履歴、実際の利用者情報、鑑定PDF、私的なテスト資料はアップロードしないでください。既存のポートフォリオは別リポジトリで管理します。

[GitHub公式: 公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
