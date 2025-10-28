// Pixel stars component - only visible in dark mode
export const Stars = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
      {/* Large stars - more prominent */}
      <div className="absolute top-8 left-16 animate-pulse">
        <div className="flex flex-col items-center">
          <div className="w-1 h-1 bg-yellow-200"></div>
          <div className="flex">
            <div className="w-1 h-1 bg-yellow-200"></div>
            <div className="w-1 h-1 bg-yellow-100"></div>
            <div className="w-1 h-1 bg-yellow-200"></div>
          </div>
          <div className="w-1 h-1 bg-yellow-200"></div>
        </div>
      </div>

      <div className="absolute top-16 right-24 animate-pulse" style={{ animationDelay: '0.5s' }}>
        <div className="flex flex-col items-center">
          <div className="w-1 h-1 bg-yellow-200"></div>
          <div className="flex">
            <div className="w-1 h-1 bg-yellow-200"></div>
            <div className="w-1 h-1 bg-yellow-100"></div>
            <div className="w-1 h-1 bg-yellow-200"></div>
          </div>
          <div className="w-1 h-1 bg-yellow-200"></div>
        </div>
      </div>

      <div className="absolute top-12 left-1/3 animate-pulse" style={{ animationDelay: '1s' }}>
        <div className="flex flex-col items-center">
          <div className="w-1 h-1 bg-yellow-200"></div>
          <div className="flex">
            <div className="w-1 h-1 bg-yellow-200"></div>
            <div className="w-1 h-1 bg-yellow-100"></div>
            <div className="w-1 h-1 bg-yellow-200"></div>
          </div>
          <div className="w-1 h-1 bg-yellow-200"></div>
        </div>
      </div>

      {/* Small stars - simple pixels */}
      <div className="w-1 h-1 bg-yellow-300 absolute top-20 left-24 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-28 left-32 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-10 right-16 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-24 right-32 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-14 left-1/2 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-32 left-48 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-18 right-48 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-22 left-12 animate-pulse" style={{ animationDelay: '1.8s' }}></div>

      {/* Medium stars - 2x2 blocks */}
      <div className="w-2 h-2 bg-yellow-200 absolute top-6 left-40 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
      <div className="w-2 h-2 bg-yellow-200 absolute top-30 right-20 animate-pulse" style={{ animationDelay: '1.3s' }}></div>
      <div className="w-2 h-2 bg-yellow-200 absolute top-26 left-20 animate-pulse" style={{ animationDelay: '0.8s' }}></div>

      {/* Additional scattered small stars for larger screens */}
      <div className="w-1 h-1 bg-yellow-300 absolute top-36 left-64 animate-pulse hidden md:block" style={{ animationDelay: '1.1s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-8 right-64 animate-pulse hidden md:block" style={{ animationDelay: '0.5s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-16 left-56 animate-pulse hidden lg:block" style={{ animationDelay: '1.4s' }}></div>
      <div className="w-1 h-1 bg-yellow-300 absolute top-34 right-56 animate-pulse hidden lg:block" style={{ animationDelay: '0.9s' }}></div>

      {/* Bright twinkling stars */}
      <div className="w-1 h-1 bg-white absolute top-15 right-12 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-1 h-1 bg-white absolute top-25 left-36 animate-pulse" style={{ animationDelay: '1.6s' }}></div>
      <div className="w-1 h-1 bg-white absolute top-11 right-28 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};
