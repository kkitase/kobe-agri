import React, { useState, useRef } from "react";
import {
  Sprout,
  Droplets,
  Thermometer,
  Camera,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCcw,
  Leaf,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { analyzeCrop, SensorData, speakAdvice } from "./services/geminiService";

const App: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    moisture: 40,
    ph: 6.5,
    ec: 1.2,
  });
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleClick = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to load sample image:", err);
      setError("サンプル画像の読み込みに失敗しました。");
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAdvice(null);
    setAudioUrl(null);
    try {
      const result = await analyzeCrop(image, sensorData);
      setAdvice(result);
    } catch (err) {
      setError("分析に失敗しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeak = async () => {
    if (!advice) return;
    if (audioUrl) {
      audioRef.current?.play();
      return;
    }

    setIsSpeaking(true);
    try {
      const url = await speakAdvice(advice);
      if (url) {
        setAudioUrl(url);
        setTimeout(() => audioRef.current?.play(), 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const reset = () => {
    setSensorData({ moisture: 40, ph: 6.5, ec: 1.2 });
    setImage(null);
    setAdvice(null);
    setError(null);
    setAudioUrl(null);
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-emerald-600 text-white py-6 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="bg-white p-2 rounded-full">
              <Sprout className="text-emerald-600 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                アグリ・アドバイザー
              </h1>
              <p className="text-emerald-100 text-sm">
                アグリさんがあなたの農業をサポート！
              </p>
            </div>
          </motion.div>
          <button
            onClick={reset}
            className="p-2 hover:bg-emerald-500 rounded-full transition-colors"
            title="リセット"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Character Intro Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-emerald-500 overflow-hidden bg-emerald-100 shadow-inner">
              <img
                src="/sample/morimoto-ichigo.jpeg"
                alt="Agri-san"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md border-2 border-white">
              アグリさん
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold mb-2 text-emerald-800">
              「お疲れ様！アグリだよ。」
            </h2>
            <p className="text-slate-600 leading-relaxed">
              今のセンサーの数値や作物の様子を教えておくれ。
              長年の経験と最新のデータから、君の畑にぴったりのアドバイスをするよ！
            </p>
          </div>
        </motion.section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sensor Data Input */}
          <motion.section
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 space-y-6"
          >
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info className="text-emerald-500 w-5 h-5" />
              センサー数値を入力
            </h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between mb-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Droplets className="text-blue-500 w-4 h-4" />
                    土壌水分量 (%)
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {sensorData.moisture}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sensorData.moisture}
                  onChange={(e) =>
                    setSensorData({
                      ...sensorData,
                      moisture: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white">
                      pH
                    </div>
                    pH (酸性度)
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {sensorData.ph}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="0.1"
                  value={sensorData.ph}
                  onChange={(e) =>
                    setSensorData({
                      ...sensorData,
                      ph: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Thermometer className="text-orange-500 w-4 h-4" />
                    EC (電気伝導度)
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {sensorData.ec} mS/cm
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={sensorData.ec}
                  onChange={(e) =>
                    setSensorData({
                      ...sensorData,
                      ec: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </motion.section>

          {/* Image Upload */}
          <motion.section
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Camera className="text-emerald-500 w-5 h-5" />
              作物の写真をアップロード
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all min-h-[160px] ${
                image
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
              }`}
            >
              {image ? (
                <div className="relative w-full h-full">
                  <img
                    src={image}
                    alt="Uploaded crop"
                    className="w-full h-48 object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <p className="text-white font-medium">写真を変更する</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="bg-slate-100 p-4 rounded-full inline-block">
                    <Camera className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    クリックして写真を選択
                  </p>
                  <p className="text-slate-400 text-xs">
                    （葉の状態がわかる写真がおすすめ）
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Sample Images */}
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                サンプル写真で試す
              </p>
              <div className="flex gap-2">
                {[
                  {
                    id: "healthy",
                    url: "/sample/good.jpeg",
                    label: "元気ないちご",
                  },
                  { id: "dry", url: "/sample/bad.jpeg", label: "枯れたいちご" },
                  {
                    id: "not-good",
                    url: "/sample/ichigo-not-good.jpeg",
                    label: "変色あり",
                  },
                ].map((sample) => (
                  <button
                    key={sample.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSampleClick(sample.url);
                    }}
                    className="flex-1 group relative h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 transition-all"
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-white font-bold">
                        {sample.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`
              px-12 py-4 rounded-full font-bold text-lg shadow-xl flex items-center gap-3 transition-all
              ${
                isAnalyzing
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                アグリさんが考え中...
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                アグリさんに相談する
              </>
            )}
          </motion.button>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {advice && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 space-y-6 relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-50 rounded-full opacity-50 pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-100 relative z-10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 w-8 h-8" />
                  <h2 className="text-2xl font-bold">アグリさんの診断結果</h2>
                </div>
                <button
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  className={`p-3 rounded-full transition-all ${
                    isSpeaking
                      ? "bg-emerald-100 text-emerald-600 animate-pulse"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                  title="アドバイスを聴く"
                >
                  {isSpeaking ? (
                    <Volume2 className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="prose prose-emerald max-w-none prose-headings:text-emerald-800 prose-strong:text-emerald-700 relative z-10">
                <div className="markdown-body">
                  <ReactMarkdown>{advice}</ReactMarkdown>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4 relative z-10">
                <div className="bg-emerald-50 px-4 py-2 rounded-full text-sm font-medium text-emerald-700 flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> 水分: {sensorData.moisture}%
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-full text-sm font-medium text-purple-700 flex items-center gap-2">
                  <span className="text-[10px] font-bold">pH</span>{" "}
                  {sensorData.ph}
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-full text-sm font-medium text-orange-700 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" /> EC: {sensorData.ec}
                </div>
              </div>

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  className="hidden"
                  onEnded={() => setIsSpeaking(false)}
                />
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 text-center text-slate-400 text-sm">
        <p>© 2025 アグリ・アドバイザー - アグリさんと一緒に育てる</p>
      </footer>
    </div>
  );
};

export default App;
