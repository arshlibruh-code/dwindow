/**
 * Simple map configuration for dwindow app
 */

// Get API key from environment variable
const MAPTILER_API_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY || '';

if (!MAPTILER_API_KEY) {
  console.warn('Warning: MAPTILER_API_KEY is not set. Map may not work correctly.');
}

export const MapConfig = {
  // Default location
  center: [0, 0], // Equator and Prime Meridian intersection
  zoom: 0, // Lower zoom for globe view
  
  // Map style
  style: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`,
  
  // Map options
  pitch: 0,
  bearing: 0,
  minZoom: 0,
  maxZoom: 22,
  terrain: true,
  
  // Amazing locations to visit
  locations: [
    { name: 'Iceland', center: [-21.8952, 64.1466] },
    { name: 'Angel Falls', center: [-62.5361, 5.9706] },
    { name: 'Mount Everest', center: [86.9250, 27.9881] },
    { name: 'Bangalore', center: [77.5946, 12.9716] },
    { name: 'Great Wall of China', center: [116.5704, 40.4319] },
    { name: 'Pyramids of Giza', center: [31.1325, 29.9792] },
    { name: 'Machu Picchu', center: [-72.5447, -13.1631] },
    { name: 'Santorini', center: [25.4615, 36.3932] },
    { name: 'Aurora Borealis', center: [18.9553, 69.6492] },
    { name: 'Grand Canyon', center: [-112.1129, 36.1069] },
    { name: 'Tokyo', center: [139.6917, 35.6895] },
    { name: 'Sahara Desert', center: [-2.3522, 31.6295] }
  ]
};
