import OpenAI from 'openai';

export class OpenAIConfig {
  private static instance: OpenAI;

  static getInstance(): OpenAI {
    if (!this.instance) {
      this.instance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'your_api_key_here', // 実際のAPIキーを後で設定
      });
    }
    return this.instance;
  }

  // クイズ生成用のプロンプトテンプレート
  static getQuizGenerationPrompt(content: string, questionCount: number = 5): string {
    return `
以下のコンテンツを基に、${questionCount}問のクイズを生成してください。
以下のJSON形式で回答してください：

{
  "quizzes": [
    {
      "title": "問題のタイトル",
      "question": "問題文",
      "type": "multiple_choice", // multiple_choice, true_false, short_answer
      "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"], // multiple_choiceの場合のみ
      "correctAnswer": "正解",
      "explanation": "解説",
      "difficulty": "medium", // easy, medium, hard
      "category": "カテゴリ"
    }
  ]
}

コンテンツ:
${content}

注意事項:
- 問題は理解度を測れる良質な問題にしてください
- 選択肢問題の場合は4つの選択肢を作成してください
- 解説は簡潔で分かりやすく書いてください
- 問題の難易度を適切に設定してください
`;
  }

  // 画像解析用のプロンプト
  static getImageAnalysisPrompt(): string {
    return `
この画像の内容を詳しく分析し、学習に役立つクイズが作成できそうな要素を抽出してください。
文字、図表、グラフ、概念などを詳細に説明してください。
`;
  }
}
