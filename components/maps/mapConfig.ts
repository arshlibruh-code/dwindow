import { MapConfig } from '@/constants/MapConfig';

// Speed multiplier for testing (1.0 = normal speed, 0.5 = 2x faster, 0.1 = 10x faster)
export const SPEED_MULTIPLIER = 1.0;

// Animation durations (in milliseconds) - base durations before multiplier
const BASE_ANIMATION_DURATIONS = {
  FULL_ROTATION: 320000,      // 320 seconds for full 360° rotation
  LOCATION_FLIGHT: 120000,    // 120 seconds to fly to location
  ZOOM_TRANSITION: 8000,      // 8 seconds for zoom transitions
  PAUSE_BETWEEN_ZOOMS: 20000, // 20 seconds pause between zoom changes
  LOCATION_CYCLE: 156000,     // Total cycle time (120s + 8s + 20s + 8s)
} as const;

// Apply speed multiplier to all durations
export const ANIMATION_DURATIONS = {
  FULL_ROTATION: BASE_ANIMATION_DURATIONS.FULL_ROTATION * SPEED_MULTIPLIER,
  LOCATION_FLIGHT: BASE_ANIMATION_DURATIONS.LOCATION_FLIGHT * SPEED_MULTIPLIER,
  ZOOM_TRANSITION: BASE_ANIMATION_DURATIONS.ZOOM_TRANSITION * SPEED_MULTIPLIER,
  PAUSE_BETWEEN_ZOOMS: BASE_ANIMATION_DURATIONS.PAUSE_BETWEEN_ZOOMS * SPEED_MULTIPLIER,
  LOCATION_CYCLE: BASE_ANIMATION_DURATIONS.LOCATION_CYCLE * SPEED_MULTIPLIER,
} as const;

// Map view settings
export const MAP_VIEW = {
  INITIAL_ZOOM: 11,
  ZOOM_IN: 14,
  ZOOM_OUT: 10,
  PITCH: 65,
  BEARINGS: {
    POSITIVE: 120,
    NEGATIVE: -120,
    ZOOM_OUT_POSITIVE: 60,
    ZOOM_OUT_NEGATIVE: -60,
  },
} as const;

// Sky configuration
export const SKY_CONFIG = {
  'sky-color': '#199EF3',
  'sky-horizon-blend': 0.5,
  'horizon-color': '#ffffff',
  'horizon-fog-blend': 0.5,
  'fog-color': '#0000ff',
  'fog-ground-blend': 0.5,
  'atmosphere-blend': [
    'interpolate',
    ['linear'],
    ['zoom'],
    0, 1,
    10, 1,
    12, 0
  ] as [string, string[], string[], number, number, number, number, number, number],
} as const;

// MapLibre GL JS version
export const MAPLIBRE_VERSION = '5.7.2';

// TypeScript types
export interface MapInstance {
  setProjection: (projection: { type: string }) => void;
  getStyle: () => any;
  setStyle: (style: any) => void;
  rotateTo: (bearing: number, options: { duration: number }) => void;
  flyTo: (options: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    duration: number;
    essential: boolean;
  }) => void;
  on: (event: string, callback: () => void) => void;
  remove: () => void;
}

export interface MapSetupResult {
  map: MapInstance | null;
  loading: boolean;
  error: Error | null;
}

export interface MapAnimationControls {
  startAnimations: () => void;
  stopAnimations: () => void;
}

export interface Location {
  name: string;
  center: [number, number];
}

// Re-export MapConfig for convenience
export { MapConfig };

