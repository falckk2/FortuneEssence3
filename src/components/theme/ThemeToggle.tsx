'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full hover:bg-sage-100 dark:hover:bg-sage-900 transition-colors"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6 text-forest-700 dark:text-sage-300" />
      ) : (
        <SunIcon className="h-6 w-6 text-sage-300" />
      )}
    </button>
  );
}
