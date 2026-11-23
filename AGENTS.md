# RELIALサイト制作の共通ルール

## 基本
- 静的サイト（HTML / site.css / site.js）。下層ページは site.css と site.js を使う。新しいCSSは site.css の末尾に追記する。
- ヘッダー・フッター・パンくず・お問い合わせ帯（contact-band）は既存のものを使う。
- 既存クラス（detail-wrap, detail-heading, eyebrow, detail-block, choice-grid, steps, tag, text-link, button）を優先し、似たクラスを新しく作らない。
- 色・フォントは site.css の変数（--ink, --muted, --blue, --rule, --pale, --jp, --en）と、下の「デザイン」で追加する --blue-2・--shadow だけを使う。
- ブレイクポイントは768px。幅375pxで横スクロールが出ないこと。

## デザイン（あたたかく、余白が広く、丸みのある雰囲気。色はRELIALの青）
- 追加してよい変数は2つだけ：--blue-2: #1f9ad6（グラデーション用）／--shadow: 0 10px 30px rgb(20 39 64 / 7%)
- セクション：上下の余白は PC 120px／SP 72px。背景は白と --pale を交互にする。
- セクション見出し：中央寄せ。上に英字ラベル（Open Sans イタリック 18〜22px、--blue から --blue-2 へのグラデーション文字）、下に日本語の見出し（36〜44px・太字）、その下にリード（中央寄せ、最大40文字幅）。英字ラベルは各セクションの内容に合う短い英語（Problem、Service、Flow、FAQ など）。
- カード：背景は白、角丸16px、1px の --rule の枠線、影は var(--shadow)、内側の余白は 28〜36px。
- 番号バッジ：44px の角丸四角（角丸12px）。--blue から --blue-2 へのグラデーションに、白のイタリック数字。カードの上辺から半分はみ出させる。
- ボタン：既存の .button（丸いピル型）。メインは --blue の背景に白文字。
- 動き：カードとブロックに既存の data-reveal を付け、スクロールでふわっと表示する。
- 画像：人物イラストは使わない。写真は assets/ の既存の画像、アイコンは図3と同じ線のアイコン。

## 原稿
- docs/content/service-industry.md の文言は一字一句そのまま使う。要約・言い換え・追加をしない。
- 「レイアウト：」で始まる行は配置の指示、「メモ：」で始まる文は制作者向けのメモ。どちらもページには表示しない。
- 「（推奨）」と「（別案）」がある場合は（推奨）を使う。
- 【要確認】が付いた文はページに出さず、HTMLコメントで残して報告する。

## リンク
- relial.jp へのリンクは使わない（旧サイトは廃止予定）。
- サイト内リンクは相対パス（例：services.html、recruitment-support.html#industry-ses）。
- お問い合わせは contact.html へリンクする（種別を選んだ状態で開くときは contact.html?type=community のようにする）。
- 月額の採用代行（monthly-rpo.html）と新卒説明会（graduate-events.html）は別サービス。業種特化の3ページからリンクしないし、ファイルも変更しない。
- 「サンプル」と書いた仮の事例・実績は、「サンプル」ラベルを付けて表示する。

## 図
- 図は docs/reference/relial-diagrams.html のHTML/CSSを移植する。画像にしない。テキストは実テキストのまま。

## 進め方
- 依頼で指定されたファイル以外は変更しない。
- 作業後、変更したファイル一覧と、完了条件のチェック結果を報告する。
