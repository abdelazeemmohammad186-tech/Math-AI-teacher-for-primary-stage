
import React, { useState, useEffect } from 'react';
import { AppState, MathSolution } from './types';
import { solveMathProblem, generateAudio, decodeAudio, createAudioBuffer, generateMathIllustration } from './services/geminiService';
import InputSection from './components/InputSection';
import Whiteboard from './components/Whiteboard';

const translations = {
  ar: {
    title: "معلمة الرياضيات الذكية",
    primary: "المرحلة الابتدائية",
    curriculum: "المنهج المصري",
    thinking: "أفكر في أسهل طريقة للشرح يا بطلة.. لحظة واحدة!",
    error: "يا بطلة، حدث خطأ بسيط. حاولي مرة أخرى وسأكون معكِ!",
    writtenSolution: "الحل النصي المكتوب",
    understanding: "🧐 فهمنا للمسألة:",
    explaining: "المعلمة تشرح لكِ الآن..",
    listen: "استمعي للشرح الصوتي",
    replay: "أسمعيني الشرح مرة ثانية",
    finalResult: "النتيجة النهائية",
    smartboard: "السبورة التعليمية الذكية",
    requestBoard: "اطلبي الحل على السبورة الذكية",
    closeBoard: "إغلاق السبورة ✖️",
    boardExplain: "المعلمة تشرح وهي تكتب.. استمتعي بالتعلم! ✨",
    future: "مستقبلك يبدأ من هنا يا بطلة 🇪🇬",
    langName: "English",
    requestDrawing: "ارسمي لي يا معلمتي",
    drawingLoading: "جاري الرسم لكِ الآن.. 🎨",
    seeDrawing: "رسمة توضيحية للمسألة",
    drawingExplain: "المعلمة تشرح الرسمة الآن.."
  },
  en: {
    title: "Smart Math Teacher",
    primary: "Primary Stage",
    curriculum: "Educational Curriculum",
    thinking: "I'm thinking of the best way to explain, champion.. just a moment!",
    error: "Champion, a small error occurred. Try again and I'll be with you!",
    writtenSolution: "Written Text Solution",
    understanding: "🧐 Our understanding:",
    explaining: "Teacher is explaining now..",
    listen: "Listen to the explanation",
    replay: "Hear the explanation again",
    finalResult: "Final Result",
    smartboard: "Smart Educational Board",
    requestBoard: "Request Whiteboard Solution",
    closeBoard: "Close Board ✖️",
    boardExplain: "The teacher explains while writing.. enjoy learning! ✨",
    future: "Your future starts here, champion! 🌟",
    langName: "العربية",
    requestDrawing: "Draw for me, Teacher",
    drawingLoading: "Drawing for you now.. 🎨",
    seeDrawing: "Illustrative Drawing",
    drawingExplain: "Teacher is explaining the drawing.."
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    isDrawingLoading: false,
    drawingUrl: null,
    solution: null,
    error: null,
    audioBlob: null,
    isAudioPlaying: false,
    previewImage: null,
    showWhiteboard: false,
    problemText: '',
    language: 'ar'
  });

  const t = translations[state.language];

  useEffect(() => {
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.language;
  }, [state.language]);

  const toggleLanguage = () => {
    setState(prev => ({ 
      ...prev, 
      language: prev.language === 'ar' ? 'en' : 'ar',
      solution: null, 
      showWhiteboard: false,
      drawingUrl: null
    }));
  };

  const playAudio = async (text: string) => {
    if (!text) return;
    try {
      setState(prev => ({ ...prev, isAudioPlaying: true }));
      const base64Audio = await generateAudio(text, state.language);
      const audioData = decodeAudio(base64Audio);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await createAudioBuffer(audioData, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setState(prev => ({ ...prev, isAudioPlaying: false }));
      source.start(0);
    } catch (err) {
      console.error("Audio playback error", err);
      setState(prev => ({ ...prev, isAudioPlaying: false }));
    }
  };

  const handleProcess = async (text: string, file: File | null) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      solution: null, 
      showWhiteboard: false,
      drawingUrl: null,
      problemText: text
    }));
    
    try {
      let input: any = text;
      let isImage = false;

      if (file) {
        isImage = true;
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });
        input = { data: base64Data, mimeType: file.type };
      }

      const solution = await solveMathProblem(input, isImage, state.language);
      setState(prev => ({ ...prev, solution, isProcessing: false }));
      
      if (solution.audioScript) {
        setTimeout(() => playAudio(solution.audioScript), 1000);
      }
    } catch (err) {
      console.error("Processing error", err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: t.error 
      }));
    }
  };

  const handleShowWhiteboard = () => {
    if (!state.solution) return;
    setState(prev => ({ ...prev, showWhiteboard: true }));
    playAudio(state.solution.whiteboardAudioScript);
  };

  const handleRequestDrawing = async () => {
    if (!state.solution) return;
    setState(prev => ({ ...prev, isDrawingLoading: true, drawingUrl: null }));
    try {
      const url = await generateMathIllustration(state.solution.drawingPrompt);
      setState(prev => ({ ...prev, drawingUrl: url, isDrawingLoading: false }));
      // Automatically explain the drawing once it's visible
      if (state.solution.drawingAudioScript) {
        setTimeout(() => playAudio(state.solution!.drawingAudioScript), 800);
      }
    } catch (err) {
      console.error("Drawing generation failed", err);
      setState(prev => ({ ...prev, isDrawingLoading: false }));
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      {/* Language Toggle */}
      <div className="flex justify-end pt-6">
        <button 
          onClick={toggleLanguage}
          className="bg-white px-6 py-2 rounded-full shadow-md font-bold text-blue-600 hover:bg-blue-50 transition-all border border-blue-100"
        >
          {t.langName}
        </button>
      </div>

      {/* Header */}
      <header className="py-10 text-center">
        <div className="inline-block bg-white p-5 rounded-full shadow-lg mb-4 border-b-4 border-blue-200">
          <span className="text-5xl">👩‍🏫</span>
        </div>
        <h1 className="text-4xl font-bold text-blue-900 mb-2">{t.title}</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">{t.primary}</span>
          <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-bold">{t.curriculum}</span>
        </div>
      </header>

      {/* Input Section */}
      <InputSection 
        onProcess={handleProcess} 
        isLoading={state.isProcessing} 
        previewUrl={state.previewImage}
        onClearPreview={() => setState(prev => ({ ...prev, previewImage: null }))}
        onPreview={(url) => setState(prev => ({ ...prev, previewImage: url }))}
        language={state.language}
      />

      {/* Loading State */}
      {state.isProcessing && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 bg-white/50 rounded-3xl backdrop-blur-sm border-2 border-dashed border-blue-200">
          <div className="relative">
            <div className="w-20 h-20 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🤔</div>
          </div>
          <p className="text-blue-800 font-bold text-xl animate-pulse">{t.thinking}</p>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border-2 border-red-100 mb-8 text-center font-bold flex items-center justify-center gap-3">
          <span>⚠️</span> {state.error}
        </div>
      )}

      {/* Solution Display Area */}
      {state.solution && !state.isProcessing && (
        <div className="space-y-10 animate-fade-in-up">
          
          {/* Section 1: Detailed Text Solution */}
          <section className="bg-white p-10 rounded-3xl shadow-xl border-t-8 border-blue-500 relative overflow-hidden">
            <div className={`absolute top-0 ${state.language === 'ar' ? 'right-0' : 'left-0'} p-4 opacity-5 pointer-events-none`}>
              <span className="text-[10rem] font-black text-blue-900 leading-none">1</span>
            </div>
            
            <h2 className="text-3xl font-bold text-blue-800 mb-8 flex items-center gap-4">
              <span className="bg-blue-100 p-3 rounded-2xl shadow-inner text-3xl">📝</span> {t.writtenSolution}
            </h2>
            
            <div className={`mb-10 p-8 bg-yellow-50 rounded-3xl ${state.language === 'ar' ? 'border-r-8' : 'border-l-8'} border-yellow-400 shadow-sm`}>
              <h3 className="text-xl font-bold text-yellow-800 mb-3">{t.understanding}</h3>
              <p className="text-slate-800 text-2xl leading-relaxed font-medium italic">{state.solution.understanding.rephrased}</p>
            </div>

            <div className="space-y-8 mb-10">
              {state.solution.textSteps.map((step, i) => (
                <div key={i} className="flex gap-6 p-6 bg-blue-50/40 rounded-3xl border border-blue-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                  <span className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg text-2xl group-hover:scale-110 transition-transform">{i + 1}</span>
                  <p className="text-slate-900 leading-relaxed text-2xl font-bold">{step}</p>
                </div>
              ))}
            </div>

            {/* Drawing Feature Button */}
            <div className="flex flex-col items-center gap-6 py-8 border-y border-slate-100">
               {!state.drawingUrl && !state.isDrawingLoading && (
                 <button 
                   onClick={handleRequestDrawing}
                   className="bg-indigo-600 text-white px-10 py-4 rounded-full font-black text-xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center gap-3 animate-pulse"
                 >
                   <span>🎨</span> {t.requestDrawing}
                 </button>
               )}

               {state.isDrawingLoading && (
                 <div className="flex items-center gap-4 text-indigo-600 font-bold text-xl animate-bounce">
                   <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                   <span>{t.drawingLoading}</span>
                 </div>
               )}

               {state.drawingUrl && (
                 <div className="w-full max-w-lg mx-auto p-4 bg-indigo-50 rounded-[2rem] border-4 border-indigo-100 shadow-2xl animate-fade-in-up">
                    <p className="text-indigo-800 font-bold mb-3 text-center flex items-center justify-center gap-2">
                      <span className="text-2xl">🖼️</span> {t.seeDrawing}
                    </p>
                    <img src={state.drawingUrl} className="w-full h-auto rounded-2xl shadow-lg border-2 border-white" alt="Math illustration" />
                    {state.isAudioPlaying && (
                       <div className="mt-4 flex items-center justify-center gap-2 bg-indigo-100 py-2 rounded-full">
                          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
                          <span className="text-indigo-800 font-bold text-sm">{t.drawingExplain}</span>
                       </div>
                    )}
                 </div>
               )}
            </div>

            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex items-center gap-3 bg-blue-50 px-6 py-2 rounded-full border border-blue-100">
                 <div className={`w-4 h-4 rounded-full ${state.isAudioPlaying ? 'bg-green-500 animate-ping' : 'bg-slate-300'}`}></div>
                 <span className="text-lg font-black text-blue-900">{state.isAudioPlaying ? t.explaining : t.listen}</span>
              </div>
              <button 
                onClick={() => playAudio(state.solution!.audioScript)}
                disabled={state.isAudioPlaying}
                className="bg-white text-blue-600 px-8 py-3 rounded-full font-black text-lg border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-3"
              >
                <span>🔊</span> {t.replay}
              </button>
            </div>
          </section>

          {/* Section 2: Big Final Result with Settle Animation */}
          <section className="bg-gradient-to-br from-emerald-500 to-teal-600 p-12 rounded-[4rem] shadow-2xl text-center text-white relative overflow-hidden">
             <div className="absolute top-6 right-10 text-white/10 text-7xl font-black">🏆</div>
             <h2 className="text-3xl font-bold mb-4">{t.finalResult}</h2>
             <div className="text-8xl font-black mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)] tracking-tighter animate-settle">{state.solution.finalResult.answer}</div>
             <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-lg inline-block">
               <p className="text-3xl font-black italic">"{state.solution.finalResult.encouragement}"</p>
             </div>
          </section>

          {/* Section 3: Whiteboard (ON REQUEST) */}
          <section className="flex flex-col items-center gap-8 py-10">
            {!state.showWhiteboard ? (
              <button 
                onClick={handleShowWhiteboard}
                className="bg-[#2c3e50] text-white px-16 py-8 rounded-[2.5rem] font-black text-3xl hover:bg-[#34495e] transition-all shadow-[0_15px_30px_rgba(0,0,0,0.3)] flex items-center gap-6 hover:scale-105 active:scale-95 group border-b-8 border-black/40"
              >
                <span className="text-5xl group-hover:rotate-12 transition-transform">🖍️</span>
                <span>{t.requestBoard}</span>
              </button>
            ) : (
              <div className="w-full space-y-8 animate-fade-in-up">
                <div className="flex justify-between items-center px-6">
                  <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                    <span className="bg-slate-200 p-3 rounded-2xl shadow-inner text-3xl">🏫</span> {t.smartboard}
                  </h2>
                  <button 
                    onClick={() => setState(prev => ({ ...prev, showWhiteboard: false }))}
                    className="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-100 transition-all border border-red-200"
                  >
                    {t.closeBoard}
                  </button>
                </div>
                
                <Whiteboard steps={state.solution.whiteboardSteps} language={state.language} />
                
                <div className="bg-blue-900 p-6 rounded-3xl text-white text-center shadow-xl border-b-8 border-black/20">
                  <p className="text-2xl font-bold">{t.boardExplain}</p>
                </div>
              </div>
            )}
          </section>

        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes settle {
          0% { transform: translateY(-50px) scale(0.5); opacity: 0; }
          20% { transform: translateY(20px) scale(1.1); }
          40% { transform: translateY(-10px) scale(0.95); }
          60% { transform: translateY(5px) scale(1.05); }
          80% { transform: translateY(0) scale(1); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-settle { animation: settle 3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* Footer */}
      <footer className="mt-32 text-center border-t-2 border-blue-100 pt-16 opacity-50">
        <div className="text-slate-400 font-black text-xl mb-6">{t.future}</div>
        <div className="flex justify-center gap-8 text-5xl">
           <span>📏</span> <span>📐</span> <span>✏️</span> <span>📓</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
