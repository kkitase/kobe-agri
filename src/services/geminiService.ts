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
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  
  const prompt = `
【センサーデータ】
- 土壌水分量: ${sensorData.moisture}%
- pH (酸性度): ${sensorData.ph}
- EC (電気伝導度): ${sensorData.ec} mS/cm

これらのデータと画像（もしあれば）を見て、アグリさんとして親身にアドバイスをお願いします。
回答はMarkdown形式で、読みやすく出力してください。
`;

  const parts: any[] = [{ text: prompt }];

  if (imageData && imageData.includes(",")) {
    const [header, base64Data] = imageData.split(",");
    const mimeMatch = header.match(/data:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

/**
 * Converts raw Big-Endian PCM (L16) data to a playable WAV data URI.
 */
const pcmToWav = (pcmBase64: string): string => {
  const binaryString = atob(pcmBase64);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const wavData = new Uint8Array(44 + pcmData.length);
  const view = new DataView(wavData.buffer);

  // RIFF header
  wavData.set([82, 73, 70, 70], 0); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true);
  wavData.set([87, 65, 86, 69], 8); // "WAVE"

  // fmt sub-chunk
  wavData.set([102, 109, 116, 32], 12); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels (Mono)
  view.setUint32(24, 24000, true); // SampleRate
  view.setUint32(28, 24000 * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  wavData.set([100, 97, 116, 97], 36); // "data"
  view.setUint32(40, pcmData.length, true);

  // Copy PCM data (Assuming Little-Endian from Gemini API)
  wavData.set(pcmData, 44);

  let binary = "";
  for (let i = 0; i < wavData.length; i++) {
    binary += String.fromCharCode(wavData[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
};

export const speakAdvice = async (text: string): Promise<string | null> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // Clean up markdown for better TTS
    const cleanText = text.replace(/[#*`]/g, "").slice(0, 500); // Limit length for TTS
    const ai = new GoogleGenAI({ apiKey: apiKey as string });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [
            {
              text: "Say the following",
            },
            {
              text: `[extremely fast] ${cleanText}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return base64Audio ? pcmToWav(base64Audio) : null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
