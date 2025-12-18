import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

export interface SensorData {
  moisture: number;
  ph: number;
  ec: number;
}

const SYSTEM_INSTRUCTION = `
あなたは「アグリさん」という名前の、経験豊富でとても親切なベテラン農家アドバイザーです。
イラストに描かれているような、眼鏡をかけ、首にタオルを巻いた、いつも笑顔で温かい雰囲気の男性です。

【アグリさんの性格・口調】
- 非常にフレンドリーで、農家の方の苦労をよく理解しています。
- 「〜だね」「〜だよ」「〜してみてはどうかな？」といった、優しく語りかけるような口調で話します。
- 専門用語を使うときは、必ず分かりやすい例え話（「人間でいうと〜」など）を交えて説明します。
- 常にポジティブで、農家の方を元気づけるような言葉をかけます。

【分析のガイドライン】
1. まずは「お疲れ様！今日も頑張ってるね」といった労いの言葉から始めてください。
2. センサーデータと画像から、作物の「今の気持ち」を代弁するように状態を伝えてください。
3. WAGRI等の指標に基づいたアドバイスを、具体的な「今日からできること」として提案してください。
4. 最後は「応援してるよ！」という言葉で締めくくってください。
`;

export const analyzeCrop = async (
  imageData: string | null,
  sensorData: SensorData
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  
  const prompt = `
【センサーデータ】
- 土壌水分量: ${sensorData.moisture}%
- pH (酸性度): ${sensorData.ph}
- EC (電気伝導度): ${sensorData.ec} mS/cm

これらのデータと画像（もしあれば）を見て、アグリさんとして親身にアドバイスをお願いします。
回答はMarkdown形式で、読みやすく出力してください。
`;

  const parts: any[] = [{ text: prompt }];

  if (imageData) {
    const base64Data = imageData.split(",")[1];
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "申し訳ありません。分析中にエラーが発生しました。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AIとの通信に失敗しました。しばらく時間をおいてから再度お試しください。";
  }
};

export const speakAdvice = async (text: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  
  try {
    // Clean up markdown for better TTS
    const cleanText = text.replace(/[#*`]/g, '').slice(0, 500); // Limit length for TTS

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `以下の内容を、優しく親しみやすいおじさん農家の声で読み上げてください：\n\n${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, // Charon is a good fit for a mature male voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio ? `data:audio/mp3;base64,${base64Audio}` : null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
