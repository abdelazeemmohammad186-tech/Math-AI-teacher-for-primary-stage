
import React, { useState, useEffect } from 'react';
import { WhiteboardStep } from '../types';

interface WhiteboardProps {
  steps: WhiteboardStep[];
  language: 'ar' | 'en';
}

const Whiteboard: React.FC<WhiteboardProps> = ({ steps, language }) => {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    setVisibleSteps(0); // Reset when steps change
  }, [steps]);

  useEffect(() => {
    if (steps.length > 0 && visibleSteps < steps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps(prev => prev + 1);
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [visibleSteps, steps]);

  const getColorClass = (color: string) => {
    switch (color) {
      case 'yellow': return 'text-yellow-300 font-bold text-3xl mb-4 drop-shadow-md';
      case 'green': return 'text-green-400 font-black text-5xl mt-10 border-4 border-green-400 p-6 rounded-2xl bg-black/40 inline-block drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]';
      case 'white': 
      default: return 'text-white text-3xl font-medium leading-loose';
    }
  };

  return (
    <div className="bg-[#1a2c2c] border-[12px] border-[#3d2b1f] rounded-[3rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative min-h-[550px] overflow-hidden flex flex-col items-center">
      {/* Chalk Tray effect */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black/20"></div>
      
      <div className={`absolute top-6 ${language === 'ar' ? 'right-8' : 'left-8'} flex items-center gap-3`}>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-white/40 text-sm font-bold tracking-widest uppercase">
          {language === 'ar' ? 'السبورة الذكية المباشرة' : 'Smart Live Board'}
        </span>
      </div>

      <div className="mt-10 w-full flex flex-col items-center text-center space-y-8">
        {steps.slice(0, visibleSteps).map((step, idx) => (
          <div 
            key={idx} 
            className={`${getColorClass(step.color)} animate-writing transition-all duration-1000 w-full`}
            style={{ 
              opacity: 1,
              transform: 'translateY(0)',
              filter: 'blur(0)',
              animation: 'chalkWrite 1.5s ease-out forwards'
            }}
          >
            {step.text}
          </div>
        ))}
        
        {visibleSteps < steps.length && (
          <div className="flex items-center gap-2 text-white/20 animate-pulse mt-4">
             <span className="text-xl">✍️</span>
             <span className="font-bold italic">
               {language === 'ar' ? 'المعلمة تكتب الآن...' : 'Teacher is writing...'}
             </span>
          </div>
        )}
      </div>

      {/* Decorative Chalks */}
      <div className={`absolute bottom-6 ${language === 'ar' ? 'left-10' : 'right-10'} flex gap-4 opacity-60`}>
        <div className="w-16 h-4 bg-white rounded-full shadow-inner rotate-3"></div>
        <div className="w-16 h-4 bg-yellow-200 rounded-full shadow-inner -rotate-6"></div>
        <div className="w-16 h-4 bg-green-300 rounded-full shadow-inner rotate-12"></div>
      </div>

      <style>{`
        @keyframes chalkWrite {
          0% { opacity: 0; transform: scale(0.95); filter: blur(5px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-writing {
          font-family: ${language === 'ar' ? "'Tajawal', sans-serif" : "sans-serif"};
        }
      `}</style>
    </div>
  );
};

export default Whiteboard;
