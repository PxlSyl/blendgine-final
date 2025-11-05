import React from 'react';
import DraggableHeader from '../../shared/DraggableHeader';
import Header from '../../heading/header';
import GradientBar from '../../shared/GradientBar';
import { Login } from './Login';

const LoginScreen: React.FC = () => {
  return (
    <DraggableHeader>
      <div className="w-full bg-gray-300 dark:bg-gray-900 dark:text-white rounded-bl-lg rounded-br-lg h-full flex flex-col">
        <Header />
        <div className="flex-1 overflow-hidden">
          <Login />
        </div>
        <GradientBar position="bottom" />
      </div>
    </DraggableHeader>
  );
};

export default LoginScreen;
