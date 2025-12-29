
import React, { useState, useRef } from 'react';
import { InputMode } from '../types';

interface InputSectionProps {
  onProcess: (text: string, file: File | null) => void;
  isLoading: boolean;
  previewUrl: string | null;
  onClearPreview: () => void;
  onPreview: (url: string | null, file: File | null) => void;
  language: 'ar' | 'en';
}

const translations = {
  ar: {
    placeholder: "اكتبي المسألة هنا.. أو الصقي صورة المسألة (Ctrl + V) 📋",
    uploadImage: "ارفعي صورة",
    talk: "تحدثي بالمسألة",
    listening: "أسمعك..",
    start: "ابدئي الشرح يا معلمتي",
    attached: "الصورة المرفقة",
    drop: "اتركي المسألة هنا 🎯"
  },
  en: {
    placeholder: "Write the problem here.. or paste an image (Ctrl + V) 📋",
    uploadImage: "Upload Image",
    talk: "Speak the problem",
    listening: "Listening...",
    start: "Start explanation, Teacher",
    attached: "Attached Image",
    drop: "Drop the problem here 🎯"
  }
};

const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading, previewUrl, onClearPreview, onPreview, language }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleStartExplanation = () => {
    if (text.trim() || previewUrl) {
      onProcess(text, selectedFile);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    onPreview(url, file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
        }
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.onstop = () => {
        setText(prev => prev + (language === 'ar' ? " [سؤال صوتي] " : " [Voice question] "));
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const clearAll = () => {
    setText('');
    setSelectedFile(null);
    onClearPreview();
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) processFile(file);
      }}
      className={`bg-white p-6 rounded-3xl shadow-xl border-2 transition-all duration-300 mb-8 ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-100'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="relative group">
          <textarea
            className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none resize-none min-h-[180px] text-xl transition-all"
            placeholder={t.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            disabled={isLoading}
          />
          
          {previewUrl && (
            <div className={`absolute bottom-4 ${language === 'ar' ? 'left-4' : 'right-4'} animate-bounce-in`}>
              <div className="relative p-2 bg-white rounded-xl shadow-2xl border-2 border-blue-400">
                <p className="text-[10px] text-blue-500 font-bold mb-1 text-center">{t.attached}</p>
                <img src={previewUrl} className="h-32 w-auto rounded-lg object-contain" alt="Problem" />
                <button 
                  onClick={(e) => { e.stopPropagation(); clearAll(); }}
                  className={`absolute -top-3 ${language === 'ar' ? '-right-3' : '-left-3'} bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg border-2 border-white`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center pointer-events-none border-4 border-dashed border-blue-400 z-10">
              <p className="text-blue-600 font-bold text-2xl">{t.drop}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-4 rounded-2xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-all flex items-center gap-2 border border-yellow-100 shadow-sm"
            >
              <span className="text-2xl">📸</span>
              <span className="hidden sm:inline font-bold">{t.uploadImage}</span>
            </button>
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }} />

            <button
              onMouseDown={startRecording}
              onMouseUp={() => { mediaRecorderRef.current?.stop(); setIsRecording(false); }}
              disabled={isLoading}
              className={`p-4 rounded-2xl transition-all flex items-center gap-2 border shadow-sm ${
                isRecording ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100'
              }`}
            >
              <span className="text-2xl">{isRecording ? '👂' : '🎤'}</span>
              <span className="hidden sm:inline font-bold">{isRecording ? t.listening : t.talk}</span>
            </button>
          </div>

          <button
            onClick={handleStartExplanation}
            disabled={isLoading || (!text.trim() && !previewUrl)}
            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl hover:shadow-blue-200 flex items-center gap-3 active:scale-95"
          >
            <span>{t.start}</span>
            <span className="text-2xl">🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
