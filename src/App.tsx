import React from 'react';
import { ChatInterface } from './components/chat/ChatInterface';
import { MenuLibrary } from './components/menus/MenuLibrary';
import { ShoppingList } from './components/shopping/ShoppingList';
import { useAppStore } from './store';

function App() {
  const { currentView } = useAppStore();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'menus':
        return <MenuLibrary />;
      case 'shopping':
        return <ShoppingList />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  );
}

export default App;