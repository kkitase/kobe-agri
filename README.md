# アグリ・アドバイザー (Agri-Advisor)

![Agri-Advisor Architecture](./public/architecture.png)

AI とセンサーデータで作物の健康診断を行い、日々の農作業を「ライフログ」として蓄積・分析することで、持続可能な農業を支援する次世代のスマート農業アプリです。

## 特徴

🌱 **AI 診断** - Gemini を使用して作物の画像とセンサーデータを分析  
📊 **センサー連携** - 土壌水分量、pH、温度を入力して総合的な診断  
📷 **画像認識** - 作物の写真をアップロードして葉の状態を確認  
📝 **ライフログ** - 作業記録や「気づき」を蓄積し、経験を資産化（将来機能）  
🔊 **音声アドバイス** - 診断結果を Gemini TTS で読み上げ  
👨‍🌾 **アグリさん** - ベテラン農家キャラクターが親身にアドバイス

## 将来的な拡張プラン (エージェンティック化)

このプロジェクトをさらに進化させるためのアイデア（マルチアドバイザー、コミュニティ共有、自律的プランニングなど）を [FUTURE_IDEAS.md](./FUTURE_IDEAS.md) にまとめています。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **UI**: TailwindCSS 4 + Motion (Framer Motion)
- **AI**: Gemini API (`gemini-3-flash-preview` / `gemini-2.5-flash-preview-tts`)
- **ビルド**: Vite 6

## アーキテクチャ

このアプリは React (Vite) で構成され、Google Cloud の信頼性の高いマネージド・サービスを組み合わせて、日々の農作業を確実にサポートします。

graph TD
    subgraph "🌱 ユーザー環境 (Local)"
        User["👨‍🌾 農家さん"]
        Device["📱 スマートフォン / PC"]
        Sensors["🌡️ センサー (水分, pH, 温度)"]
        Camera["📷 カメラ (作物撮影)"]
    end

    subgraph "🚀 フロントエンド (React 19 + Vite 6)"
        UI["🎨 TailwindCSS 4 / Motion"]
        State["🔄 診断ロジック / 状態管理"]
    end

    subgraph "☁️ Google Cloud Platform"
        subgraph "🚀 実行基盤"
            Run["Cloud Run (Docker)"]
        end
        
        subgraph "🧠 AI サービス"
            Gemini["Gemini API<br/>(Multimodal / TTS)"]
        end
    end

    %% データの流れ
    User --> Device
    Sensors --> UI
    Camera --> UI
    Device <--> Run
    Run <--> Gemini
    Gemini -- "🔊 音声アドバイス" --> User

## ローカル実行

**必要条件**: Node.js

1. 依存関係をインストール:
   ```bash
   npm install
   ```

2. `.env.local` に Gemini API キーを設定:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. アプリを起動:
   ```bash
   npm run dev
   ```

4. ブラウザで http://localhost:3000 を開く

## 使い方

1. **センサー数値を入力** - スライダーで土壌水分量、pH、温度、日光を調整
2. **作物の写真をアップロード** - カメラで撮影またはサンプル写真を選択
3. **「アグリさんに相談する」をクリック** - AI が診断結果とアドバイスを表示
4. **音声で聴く** - スピーカーボタンでアドバイスを読み上げ

## デプロイ (Google Cloud Run)

このアプリは Docker 化されており、Google Cloud Run へのデプロイが可能です。

1. **事前準備**:
   - Google Cloud プロジェクトの作成と `gcloud` CLI の設定。
   - Cloud Build および Cloud Run API の有効化。

### デプロイ・スクリプト (`deploy_gcp.sh`) の詳細
   
   リポジトリに含まれる `deploy_gcp.sh` は、以下の 2 つのステップを自動化します。
   
   1.  **Google Cloud Build によるビルド**:
       - `.env.local` から `GEMINI_API_KEY` を読み込みます。
       - `cloudbuild.yaml` を使用して、Docker イメージをビルドします。
       - ビルド時に `--build-arg` を介して API キーを Vite のビルドプロセスに注入します。これで、フロントエンドから API キーが利用可能になります。
   2.  **Google Cloud Run へのデプロイ**:
       - ビルドされたイメージを Cloud Run にデプロイします。
       - `--allow-unauthenticated` フラグにより、公開アクセス可能な状態でサービスを起動します。
   
   ```bash
   chmod +x deploy_gcp.sh
   ./deploy_gcp.sh
   ```
   ※ `.env.local` に設定された `GEMINI_API_KEY` がビルド時に注入されます。

## セキュリティ・ベストプラクティス (重要)

このアプリはフロントエンドから直接 Gemini API を呼び出すため、公開時には以下のセキュリティ対策を強く推奨します。

### 1. API キーの制限 (Google Cloud コンソール)

API キーが第三者に盗用されるのを防ぐため、[Google Cloud Console](https://console.cloud.google.com/apis/credentials) または [Google AI Studio](https://aistudio.google.com/app/apikey) で以下の制限を設定してください。

- **アプリケーションの制限**: 「HTTP リファラー」を選択し、以下のドメインを許可リストに追加します。
  - `http://localhost:3000/*` (ローカル開発用)
  - `https://your-app-name-*.a.run.app/*` (Cloud Run のデプロイ先URL)
- **API の制限**: 「Gemini API」のみに使用を制限します。

### 2. 今後の検討事項 (本格運用向け)

プロジェクトが成長し、より高いセキュリティが必要な場合は、以下の構成への移行を検討してください。

- **バックエンド・プロキシの導入**: Cloud Run 上で API キーを保持し、フロントエンドからのリクエストを中継する仕組み。これにより、ブラウザ側に API キーが露出することを完全に防げます。
- **Google Cloud Secret Manager**: API キーを Cloud Build や Dockerfile に直接含めるのではなく、Secret Manager から安全に取得する構成。

## プロジェクト構成

```
kobe-agri/
├── public/
│   └── sample/              # サンプル画像・データ
│       ├── sensor_optimal.json
│       ├── sensor_dry.csv
│       └── *.jpeg           # 各種画像
├── src/
├── index.html
└── package.json
```

## ライセンス

© 2025 アグリ・アドバイザー
