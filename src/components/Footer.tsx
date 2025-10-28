export const Footer = () => {
  return (
    <div className="absolute bottom-2 right-3 sm:bottom-4 sm:right-6 z-20">
      <a
        href="https://github.com/crypticsy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-700 dark:text-slate-300 text-[8px] sm:text-[10px] md:text-xs font-bold hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        style={{
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}
      >
        Created by Crypticsy
      </a>
    </div>
  );
};
