import React, { useState, useEffect } from 'react';

import Header from '../heading/header';

interface IntroProps {
  onIntroComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onIntroComplete }) => {
  const [animationStage, setAnimationStage] = useState<number>(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 1000);
    const timer2 = setTimeout(() => setAnimationStage(2), 2000);
    const timer3 = setTimeout(() => {
      setAnimationStage(3);
      onIntroComplete();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onIntroComplete]);

  const Logo = './assets/blendgine_logo.png';

  return (
    <div className="h-screen flex flex-col font-sans">
      <div className="relative w-full h-full grow overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full overflow-hidden">
            <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col relative shadow-xl">
              <div className="sticky top-0 z-50 bg-inherit">
                <Header />
              </div>
              <div className="flex-1 overflow-hidden flex items-center justify-center">
                <div className={`text-center intro-animation ${animationStage >= 2 ? 'move' : ''}`}>
                  <img src={Logo} className="w-32 h-32 mb-4" alt="Blendgine Logo" />
                  <div
                    className={`text-6xl font-bold tracking-wide font-title text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] ${animationStage === 0 ? 'animate-pulse' : ''}`}
                  >
                    Blendgine
                  </div>
                  <div className="text-xl font-medium text-gray-600 dark:text-gray-400 mt-2">
                    Blend your art. Forge your world.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;
