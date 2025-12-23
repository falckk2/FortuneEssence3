'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full hover:bg-sage-100 dark:hover:bg-[#343c39] transition-all duration-300 group"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6 text-forest-700 group-hover:text-sage-700 transition-colors" />
      ) : (
        <SunIcon className="h-6 w-6 text-[#E8EDE8] group-hover:text-sage-400 transition-colors" />
      )}
    </button>
  );
}
