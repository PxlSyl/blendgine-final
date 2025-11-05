import React from 'react';
import Confetti from 'react-confetti';

interface SuccessScreenProps {
  message: string;
  showConfetti: boolean;
  onBackToMenu: () => void;
  onQuit: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({
  message,
  showConfetti,
  onBackToMenu,
  onQuit,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full animate-fade-in">
      {showConfetti && <Confetti width={window.innerWidth / 2} height={window.innerHeight} />}
      <img
        src="./assets/anim_success.webp"
        alt="Success"
        className="w-64 h-64 lg:w-96 lg:h-96 mb-8 object-contain"
      />
      <div className="flex justify-center text-center text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide font-title text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary-dark))] animate-pulse mb-8 px-4">
        {message}
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onBackToMenu}
          className="bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] text-white font-medium py-2 px-4 rounded-sm cursor-pointer"
        >
          Menu
        </button>
        <button
          onClick={onQuit}
          className="bg-[rgb(var(--color-quaternary))] hover:bg-[rgb(var(--color-quaternary-dark))] text-white font-medium py-2 px-4 rounded-sm cursor-pointer"
        >
          Quit
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
