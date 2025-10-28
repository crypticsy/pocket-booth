// Pixel art clouds component - lighter in dark mode
export const Clouds = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Cloud 1 - Top left */}
      <div className="absolute top-8 left-12 animate-float">
        <div className="flex flex-col items-center">
          <div className="w-8 h-3 bg-white dark:bg-gray-600"></div>
          <div className="flex">
            <div className="w-3 h-3 bg-white dark:bg-gray-600"></div>
            <div className="w-12 h-3 bg-white dark:bg-gray-600"></div>
            <div className="w-3 h-3 bg-white dark:bg-gray-600"></div>
          </div>
          <div className="w-20 h-4 bg-white dark:bg-gray-600"></div>
          <div className="w-16 h-3 bg-white dark:bg-gray-600"></div>
        </div>
      </div>

      {/* Cloud 2 - Top right */}
      <div className="absolute top-16 right-20 animate-float-delayed">
        <div className="flex flex-col items-center">
          <div className="w-6 h-2 bg-white dark:bg-gray-600"></div>
          <div className="flex">
            <div className="w-2 h-3 bg-white dark:bg-gray-600"></div>
            <div className="w-10 h-3 bg-white dark:bg-gray-600"></div>
            <div className="w-2 h-3 bg-white dark:bg-gray-600"></div>
          </div>
          <div className="w-16 h-3 bg-white dark:bg-gray-600"></div>
          <div className="w-12 h-2 bg-white dark:bg-gray-600"></div>
        </div>
      </div>

      {/* Cloud 3 - Middle */}
      <div className="absolute top-24 left-1/3 animate-float-slow">
        <div className="flex flex-col items-center">
          <div className="w-10 h-3 bg-white dark:bg-gray-600"></div>
          <div className="flex">
            <div className="w-4 h-4 bg-white dark:bg-gray-600"></div>
            <div className="w-14 h-4 bg-white dark:bg-gray-600"></div>
            <div className="w-4 h-4 bg-white dark:bg-gray-600"></div>
          </div>
          <div className="w-24 h-5 bg-white dark:bg-gray-600"></div>
          <div className="w-20 h-3 bg-white dark:bg-gray-600"></div>
        </div>
      </div>

      {/* Cloud 4 - Small cloud top center */}
      <div className="absolute top-12 left-1/2 animate-float">
        <div className="flex flex-col items-center">
          <div className="w-5 h-2 bg-white dark:bg-gray-600"></div>
          <div className="flex">
            <div className="w-2 h-2 bg-white dark:bg-gray-600"></div>
            <div className="w-8 h-2 bg-white dark:bg-gray-600"></div>
            <div className="w-2 h-2 bg-white dark:bg-gray-600"></div>
          </div>
          <div className="w-12 h-3 bg-white dark:bg-gray-600"></div>
        </div>
      </div>

      {/* Cloud 5 - Bottom right (higher up) */}
      <div className="absolute top-32 right-12 animate-float-delayed hidden sm:block">
        <div className="flex flex-col items-center">
          <div className="w-7 h-2 bg-white dark:bg-gray-600"></div>
          <div className="flex">
            <div className="w-3 h-3 bg-white dark:bg-gray-600"></div>
            <div className="w-11 h-3 bg-white dark:bg-gray-600"></div>
            <div className="w-3 h-3 bg-white dark:bg-gray-600"></div>
          </div>
          <div className="w-18 h-4 bg-white dark:bg-gray-600"></div>
          <div className="w-14 h-2 bg-white dark:bg-gray-600"></div>
        </div>
      </div>

      {/* Cloud 6 - Far left middle */}
      <div className="absolute top-20 left-4 animate-float-slow hidden md:block">
        <div className="flex flex-col items-center">
          <div className="w-6 h-2 bg-white dark:bg-gray-600"></div>
          <div className="w-10 h-3 bg-white dark:bg-gray-600"></div>
          <div className="w-14 h-4 bg-white dark:bg-gray-600"></div>
        </div>
      </div>
    </div>
  );
};
