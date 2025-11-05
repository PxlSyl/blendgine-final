import React, { useRef, useEffect } from 'react';

import { useRarityMessages } from './hooks/useRarityMessages';
import { useRarity } from '@/components/store/rarityStore/hook';

interface RarityConsoleProps {
  selectedLayer: string;
  activeSet: string;
}

const RarityConsole: React.FC<RarityConsoleProps> = ({ selectedLayer, activeSet }) => {
  const { messages } = useRarityMessages(selectedLayer, activeSet);
  const { isGlobalViewActive } = useRarity();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className={`h-[230px] bg-gray-100 dark:bg-gray-900 font-mono text-sm rounded-sm overflow-hidden mt-4`}
    >
      <div
        className={`flex items-center justify-between px-4 py-1 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700`}
      >
        <span
          className={
            isGlobalViewActive
              ? 'text-[rgb(var(--color-accent))] font-semibold'
              : 'text-[rgb(var(--color-secondary))] font-semibold'
          }
        >
          {isGlobalViewActive ? 'Global Rarity Console' : 'Rarity Console'}
        </span>
      </div>
      <div className="p-4 h-[calc(100%-40px)] overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <div className="flex items-start">
              <span className="text-gray-500 mr-2 opacity-75">[{msg.timestamp}]</span>
              <div className={msg.className} dangerouslySetInnerHTML={{ __html: msg.content }} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default RarityConsole;
