import { useState, useEffect, useMemo } from 'react';

type BuildingConfig = {
  width: number;
  height: number;
  roofType: 'flat' | 'peaked' | 'antenna';
  windowPattern: boolean[];
};

const COLOR = 'bg-gray-400 dark:bg-gray-950';

const generateWindowPattern = (totalWindows: number): boolean[] =>
  Array.from({ length: totalWindows }, () => Math.random() > 0.3);

const calculateWindowGrid = (width: number, height: number) => {
  const cols = width < 70 ? 2 : width < 100 ? 3 : width < 130 ? 4 : 5;
  const availableWidth = width - 16;
  const availableHeight = height - 16;
  const gap = 4;
  const windowWidth = Math.floor((availableWidth - (cols - 1) * gap) / cols);
  const rows = Math.max(3, Math.floor(availableHeight / (windowWidth + gap)));
  return { cols, rows, windowSize: windowWidth };
};

const generateBuilding = ({ width, height, roofType, windowPattern }: BuildingConfig, index: number) => {
  const { cols, rows, windowSize } = calculateWindowGrid(width, height);
  const roofWidth = { width: `${width}px` };

  // Assign different wiggle animations to different buildings
  const wiggleVariants = ['wiggle', 'wiggle-slow', 'wiggle-fast'];
  const wiggleClass = wiggleVariants[index % wiggleVariants.length];

  const roofs = {
    flat: <div className={`h-4 ${COLOR}`} style={roofWidth} />,
    antenna: (
      <div className="flex flex-col items-center">
        <div className={`w-2 h-8 ${COLOR}`} />
        <div className={`h-4 ${COLOR}`} style={roofWidth} />
      </div>
    ),
    peaked: (
      <div className="flex flex-col items-center">
        <div className={`w-4 h-3 ${COLOR} mx-auto`} />
        <div className={`w-8 h-3 ${COLOR} mx-auto`} />
        <div className={`h-4 ${COLOR}`} style={roofWidth} />
      </div>
    ),
  };

  return (
    <div
      key={index}
      className="flex flex-col items-center"
      style={{
        minWidth: `${width}px`,
        animation: `${wiggleClass} ${3 + (index % 3)}s ease-in-out infinite`
      }}
    >
      {roofs[roofType]}
      <div className={`${COLOR} p-2`} style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="h-full flex flex-col justify-between">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {Array.from({ length: cols }, (_, colIndex) => (
                <div
                  key={colIndex}
                  className={windowPattern[(rowIndex * cols + colIndex) % windowPattern.length]
                    ? 'bg-slate-300/20 dark:bg-yellow-200/5'
                    : 'bg-gray-800/2 dark:bg-gray-900/20'}
                  style={{ width: `${windowSize}px`, height: `${windowSize}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const generateRandomBuilding = (isMobile: boolean): BuildingConfig => {
  const roofTypes: ('flat' | 'peaked' | 'antenna')[] = ['flat', 'peaked', 'antenna'];
  const widths = [65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165];
  const baseHeights = [85, 95, 100, 110, 115, 120, 130, 140, 150, 155, 170, 180, 185, 195, 200, 210, 220, 225, 240, 260, 265, 280, 300, 310, 330, 370, 390, 420, 435, 480, 520];

  const width = widths[Math.floor(Math.random() * widths.length)];
  const height = Math.floor(baseHeights[Math.floor(Math.random() * baseHeights.length)] * (isMobile ? 0.6 : 1.0));
  const { cols, rows } = calculateWindowGrid(width, height);

  return {
    width,
    height,
    roofType: roofTypes[Math.floor(Math.random() * roofTypes.length)],
    windowPattern: generateWindowPattern(cols * rows),
  };
};

// Shuffle array utility
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Session storage keys (updated version to force regeneration with consistent colors)
const SESSION_KEY_LAYER1 = 'houses_layer1_v2';
const SESSION_KEY_LAYER2 = 'houses_layer2_v2';
const SESSION_KEY_LAYER3 = 'houses_layer3_v2';
const SESSION_KEY_ISMOBILE = 'houses_isMobile_v2';

type HouseLayerProps = {
  buildingCount: number;
  blurAmount: string;
  opacity: number;
  zIndex: number;
  layerKey: string;
};

const HouseLayer = ({ buildingCount, blurAmount, opacity, zIndex, layerKey }: HouseLayerProps) => {
  const [buildings, setBuildings] = useState<BuildingConfig[]>([]);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      return isMobileDevice;
    };

    const mobileStatus = checkMobile();

    // Try to load from sessionStorage
    const storedBuildings = sessionStorage.getItem(layerKey);
    const storedMobileStatus = sessionStorage.getItem(SESSION_KEY_ISMOBILE);

    // Check if we have stored buildings AND the mobile status hasn't changed
    if (storedBuildings && storedMobileStatus === String(mobileStatus)) {
      try {
        setBuildings(JSON.parse(storedBuildings));
        return;
      } catch (e) {
        console.error('Failed to parse stored buildings', e);
      }
    }

    // Generate new buildings
    const newBuildings = shuffleArray(
      Array.from({ length: buildingCount }, () => generateRandomBuilding(mobileStatus))
    );
    setBuildings(newBuildings);

    // Store in sessionStorage
    sessionStorage.setItem(layerKey, JSON.stringify(newBuildings));
    sessionStorage.setItem(SESSION_KEY_ISMOBILE, String(mobileStatus));
  }, [buildingCount, layerKey]);

  // Memoize the rendered buildings to prevent re-renders
  const renderedBuildings = useMemo(() => {
    return buildings.map((building, index) => generateBuilding(building, index));
  }, [buildings]);

  if (buildings.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-end pointer-events-none"
      style={{
        gap: '0px',
        filter: `blur(${blurAmount})`,
        opacity,
        zIndex,
      }}
    >
      {renderedBuildings}
    </div>
  );
};

export const Houses = () => {
  return (
    <>
      {/* Layer 3 (Farthest back) - Most blur */}
      <HouseLayer buildingCount={25} blurAmount="10px" opacity={0.5} zIndex={1} layerKey={SESSION_KEY_LAYER3} />

      {/* Layer 2 (Middle) - Medium blur */}
      <HouseLayer buildingCount={22} blurAmount="5px" opacity={0.7} zIndex={2} layerKey={SESSION_KEY_LAYER2} />

      {/* Layer 1 (Front) - Slight blur */}
      <HouseLayer buildingCount={20} blurAmount="0px" opacity={1} zIndex={3} layerKey={SESSION_KEY_LAYER1} />
    </>
  );
};
