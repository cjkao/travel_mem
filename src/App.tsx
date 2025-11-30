import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MapPin, Send, Sparkles, Image as ImageIcon, Trash2, Share2, StopCircle, Map as MapIcon, ExternalLink } from 'lucide-react';

// 模擬的類型定義
type MemoryType = 'photo' | 'voice' | 'text';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string; // 照片URL或文字內容
  timestamp: Date;
  location: LocationData;
}

export default function App() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData>({ name: '定位中...', lat: 0, lng: 0 });

  // 模擬定位系統 (模擬 GPS 座標變化)
  useEffect(() => {
    const locations: LocationData[] = [
      { name: '台北 101', lat: 25.0339, lng: 121.5644 },
      { name: '東京淺草寺', lat: 35.7147, lng: 139.7967 },
      { name: '巴黎艾菲爾鐵塔', lat: 48.8584, lng: 2.2945 },
      { name: '京都清水寺', lat: 34.9949, lng: 135.7850 },
      { name: '紐約時代廣場', lat: 40.7580, lng: -73.9855 }
    ];

    // 隨機切換位置以模擬移動
    const interval = setInterval(() => {
      setCurrentLocation(locations[Math.floor(Math.random() * locations.length)]);
    }, 5000);

    setCurrentLocation(locations[0]); // 初始位置

    return () => clearInterval(interval);
  }, []);

  // 處理照片上傳
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const newMemory: MemoryItem = {
        id: Date.now().toString(),
        type: 'photo',
        content: imageUrl,
        timestamp: new Date(),
        location: currentLocation,
      };
      setMemories(prev => [newMemory, ...prev]);
    }
  };

  // 模擬語音識別 (Web Speech API Wrapper)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'cmn-Hant-TW'; // 繁體中文

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (transcript.trim()) {
        addTextMemory(transcript);
        setTranscript('');
      }
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const addTextMemory = (text: string) => {
    const newMemory: MemoryItem = {
      id: Date.now().toString(),
      type: 'voice', // 標記為語音來源
      content: text,
      timestamp: new Date(),
      location: currentLocation,
    };
    setMemories(prev => [newMemory, ...prev]);
  };

  // 模擬 AI 生成遊記 (包含地圖資訊)
  const generateStory = () => {
    if (memories.length === 0) return;
    setIsGenerating(true);

    // 收集所有去過的地點
    const uniqueLocations = Array.from(new Set(memories.map(m => m.location.name)));

    setTimeout(() => {
      const story = `
# 🗺️ 旅程回憶錄：${uniqueLocations[0]} 之旅

**📅 日期**：${new Date().toLocaleDateString()}
**📍 足跡**：${uniqueLocations.join(' ➝ ')}

---

### 🚶‍♂️ 旅遊路線圖 (Google Maps Timeline)
*(此處模擬 Google Maps 路徑預覽)*
> 系統已自動將您的 ${memories.length} 個打卡點連成一條路徑。
> [🔗 點擊查看 Google Maps 完整路線](https://www.google.com/maps/dir/${memories.map(m => m.location.name).join('/')})

---

### 📸 旅途高光時刻

${memories.map(m => {
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${m.location.lat},${m.location.lng}`;

  if (m.type === 'voice') return `
**📍 ${m.location.name}**
> 💭 語音筆記：「${m.content}」
> [🗺️ 查看地圖座標](${mapLink})
`;
  if (m.type === 'photo') return `
**📍 ${m.location.name}**
(📸 這裡拍下的照片捕捉了當下的氛圍)
> [🗺️ 查看地圖座標](${mapLink})
`;
  return '';
}).join('\n')}

---
*這篇遊記由 TravelMemory AI 自動彙整，結合了您的照片、語音口述與 Google Maps 足跡。*
      `;
      setGeneratedStory(story);
      setIsGenerating(false);
    }, 2500);
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const openMap = (loc: LocationData) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-blue-200 shadow-lg">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900">旅遊回憶助手</h1>
            <p className="text-xs text-blue-600 flex items-center gap-1 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {currentLocation.name}
            </p>
          </div>
        </div>
        <button
          onClick={generateStory}
          disabled={memories.length === 0}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
            memories.length > 0
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:scale-105 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Sparkles size={16} />
          生成遊記
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto pb-32">

        {/* Welcome State */}
        {memories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 rotate-3">
              <MapIcon size={40} className="text-blue-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-2">開始您的旅程</h3>
            <p className="text-sm text-center max-w-xs leading-relaxed">
              隨手拍張照，或是按住麥克風說話。<br/>我們會自動記錄您的
              <span className="text-blue-500 font-medium mx-1">Google Maps 位置</span>
            </p>
          </div>
        )}

        {/* Generated Story Modal */}
        {generatedStory && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-900/5">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sparkles size={16} className="text-yellow-400"/> AI Travel Log
              </h2>
              <button onClick={() => setGeneratedStory(null)} className="text-slate-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 prose prose-slate prose-sm max-w-none whitespace-pre-line bg-white">
              {generatedStory}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <span className="text-xs text-slate-400 font-medium">已儲存至 Google Keep</span>
               <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors">
                 <Share2 size={16} /> 分享連結
               </button>
            </div>
          </div>
        )}

        {/* Memory Timeline */}
        <div className="relative space-y-6 pl-4">
          {/* Vertical Line */}
          {memories.length > 0 && (
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
          )}

          {memories.map((memory) => (
            <div key={memory.id} className="relative flex gap-4 animate-fade-in-up group">

              {/* Timeline Icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md border-2 border-white transition-transform group-hover:scale-110 ${memory.type === 'photo' ? 'bg-orange-400' : 'bg-indigo-500'}`}>
                  {memory.type === 'photo' ? <ImageIcon size={18} /> : <Mic size={18} />}
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                {/* Header info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {memory.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => openMap(memory.location)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full"
                    >
                      <MapPin size={10} />
                      {memory.location.name}
                    </button>
                  </div>
                  <button onClick={() => deleteMemory(memory.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Body Content */}
                {memory.type === 'photo' ? (
                  <div className="relative group/image overflow-hidden rounded-xl bg-slate-100">
                    <img src={memory.content} alt="Travel memory" className="w-full h-48 object-cover transform group-hover/image:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                      <MapPin size={10} /> GPS: {memory.location.lat.toFixed(2)}, {memory.location.lng.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                     <div className="absolute -left-2 top-0 bottom-0 w-1 bg-indigo-100 rounded-full"></div>
                     <p className="text-slate-700 text-base leading-relaxed pl-3 font-medium">
                      "{memory.content}"
                    </p>
                  </div>
                )}

                {/* Map Action Footer */}
                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                   <button
                     onClick={() => openMap(memory.location)}
                     className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                   >
                     <ExternalLink size={12} /> 在 Google Maps 開啟
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">

        {/* Real-time Transcription Display */}
        {isRecording && (
          <div className="absolute bottom-full left-0 right-0 bg-indigo-600/90 text-white p-4 backdrop-blur-sm animate-pulse shadow-lg">
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="flex gap-1 mb-2">
                 {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: `${i*100}ms`}}></div>)}
              </div>
              <p className="text-center font-medium text-lg">{transcript || "正在聆聽..."}</p>
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto flex items-center justify-between gap-8 px-4">
          {/* Photo Button */}
          <label className="flex flex-col items-center gap-1.5 cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-active:scale-90 transition-all text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm border border-slate-200">
              <ImageIcon size={22} />
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-wide">照片</span>
          </label>

          {/* Voice Button (Center) */}
          <button
            onClick={toggleRecording}
            className={`relative w-18 h-18 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 transition-all transform ${
              isRecording
                ? 'bg-red-500 text-white scale-110 ring-4 ring-red-100 shadow-red-200 w-20 h-20 -translate-y-2'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 w-16 h-16 -translate-y-1'
            }`}
          >
            {isRecording ? <StopCircle size={28} /> : <Mic size={28} />}
          </button>

          {/* Text/Note Button */}
          <button className="flex flex-col items-center gap-1.5 group" onClick={() => alert("此功能為示意：可開啟 Google Keep 編輯")}>
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-active:scale-90 transition-all text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm border border-slate-200">
              <Send size={22} />
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-wide">文字</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-3xl"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-3xl animate-spin"></div>
            <Sparkles className="text-blue-600 animate-pulse" size={32}/>
          </div>
          <h3 className="text-xl font-bold text-slate-800">正在規劃您的回憶地圖...</h3>
          <p className="text-slate-500 mt-2 text-sm">AI 正在計算路徑並彙整照片</p>
        </div>
      )}
    </div>
  );
}
