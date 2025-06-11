import { create } from 'zustand';

interface SavedMenu {
  id: string;
  title: string;
  meals: string[];
  createdAt: Date;
  isFavorite: boolean;
}

interface AppState {
  currentView: 'chat' | 'menus' | 'shopping';
  savedMenus: SavedMenu[];
  
  // Actions
  setCurrentView: (view: 'chat' | 'menus' | 'shopping') => void;
  addSavedMenu: (menu: SavedMenu) => void;
  toggleMenuFavorite: (id: string) => void;
  deleteSavedMenu: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'chat',
  savedMenus: [
    {
      id: '1',
      title: 'Week of December 9th',
      meals: [
        'Monday: Chinese noodles with pork',
        'Tuesday: Lasagna',
        'Wednesday: Fried fish with rice and peas',
        'Thursday: Smoked salmon with lemon pasta',
        'Friday: Fish curry'
      ],
      createdAt: new Date('2024-12-09'),
      isFavorite: true
    },
    {
      id: '2',
      title: 'Week of December 2nd',
      meals: [
        'Monday: Mushroom risotto',
        'Tuesday: Stroganoff',
        'Wednesday: Empanadas with rice',
        'Thursday: Hamburger with fries',
        'Friday: Carbonara',
        'Saturday: Pizza'
      ],
      createdAt: new Date('2024-12-02'),
      isFavorite: false
    }
  ],
  
  setCurrentView: (view) => set({ currentView: view }),
  addSavedMenu: (menu) => set((state) => ({ 
    savedMenus: [menu, ...state.savedMenus] 
  })),
  toggleMenuFavorite: (id) => set((state) => ({
    savedMenus: state.savedMenus.map(menu =>
      menu.id === id ? { ...menu, isFavorite: !menu.isFavorite } : menu
    )
  })),
  deleteSavedMenu: (id) => set((state) => ({
    savedMenus: state.savedMenus.filter(menu => menu.id !== id)
  })),
}));