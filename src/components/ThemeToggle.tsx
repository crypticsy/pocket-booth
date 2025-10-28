import { IoSunny, IoMoon } from "react-icons/io5";

type ThemeToggleProps = {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
};

export const ThemeToggle = ({ appState, setAppState }: ThemeToggleProps) => {
  const theme = appState?.theme || "light";
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setAppState((prev: any) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  };

  return (
    <button
      onClick={toggleTheme}
      className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 bg-transparent p-1.5 sm:p-2 transition-all text-yellow-500 hover:text-yellow-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer hover:scale-110"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        top: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))',
        right: 'max(0.75rem, env(safe-area-inset-right, 0.75rem))'
      }}
    >
      {isDark ? (
        <IoMoon className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 animate-pulse" />
      ) : (
        <IoSunny className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 animate-spin-slow" />
      )}
    </button>
  );
};
