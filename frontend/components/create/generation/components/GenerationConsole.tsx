import React, { useRef, useEffect, useState } from 'react';

import type { ConsoleMessage } from '@/types/effect';

import { PlayIcon, PauseIcon } from '@/components/icons/PlayPause';
import { Tooltip } from '@/components/shared/ToolTip';

interface GenerationConsoleProps {
  messages: ConsoleMessage[];
  onPauseToggle: (isPaused: boolean) => void;
  isPaused: boolean;
  isProcessing: boolean;
  isCancelling?: boolean;
}

const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') {
          return '';
        }
        return `${prev}.`;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-6">{dots}</span>;
};

export const GenerationConsole: React.FC<GenerationConsoleProps> = ({
  messages,
  onPauseToggle,
  isPaused,
  isProcessing,
  isCancelling = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'success':
        return 'text-[rgb(var(--color-secondary))]';
      case 'error':
        return 'text-[rgb(var(--color-quaternary))]';
      case 'warning':
        return 'text-[rgb(var(--color-quaternary))]';
      default:
        return 'text-[rgb(var(--color-accent))]';
    }
  };

  const formatMessage = (message: string) => {
    const styledMessage = message
      .replace(
        /<artwork>(.*?)<\/artwork>/g,
        '<span class="text-[rgb(var(--color-primary))] font-bold">$1</span>'
      )
      .replace(/<trait>(.*?)<\/trait>/g, '<span class="text-[rgb(var(--color-accent))]">$1</span>')
      .replace(/<attr>(.*?)<\/attr>/g, '<span class="text-[rgb(var(--color-secondary))]">$1</span>')
      .replace(
        /<value>(.*?)<\/value>/g,
        '<span class="text-[rgb(var(--color-quaternary))]">$1</span>'
      )
      .replace(/<index>(.*?)<\/index>/g, '<span class="text-gray-500">$1</span>')
      .replace(
        /<progress>(.*?)<\/progress>/g,
        '<span class="text-[rgb(var(--color-secondary-dark))]">$1</span>'
      );

    if (message.includes('\n')) {
      const lines = styledMessage.split('\n');
      return (
        <>
          {lines.map((line, index) => (
            <div key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </>
      );
    }
    return <div className="ml-4" dangerouslySetInnerHTML={{ __html: styledMessage }} />;
  };

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-gray-800 border-b border-gray-700">
        <span className="text-[rgb(var(--color-secondary))] font-semibold">Generation Console</span>
        {isProcessing && !isCancelling && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px]">
              {isPaused ? (
                'Paused'
              ) : (
                <span className="flex">
                  Running
                  <LoadingDots />
                </span>
              )}
            </span>
            <Tooltip tooltip={isPaused ? 'Resume Generation' : 'Pause Generation'}>
              <button
                onClick={() => onPauseToggle(!isPaused)}
                className="p-0.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              >
                {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
              </button>
            </Tooltip>
          </div>
        )}
        {isCancelling && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgb(var(--color-quaternary))] font-medium">
              Cancelling...
            </span>
          </div>
        )}
      </div>
      <div className="p-4 h-[calc(100%-40px)] overflow-y-auto">
        {isCancelling ? (
          <div className="mb-2">
            <div className="flex items-start">
              <span className="text-gray-500 mr-2 opacity-75">
                [{new Date().toLocaleTimeString()}]
              </span>
              <div className="text-[rgb(var(--color-quaternary))] whitespace-pre-wrap">
                🚫 Generation cancelled. Cleaning up resources and stopping all processes...
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <div className="flex items-start">
                  <span className="text-gray-500 mr-2 opacity-75">[{msg.timestamp}]</span>
                  <div className={`${getMessageColor(msg.type)} whitespace-pre-wrap`}>
                    {formatMessage(msg.message)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};
