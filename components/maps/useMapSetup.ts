import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { MapConfig, MAPLIBRE_VERSION, SKY_CONFIG, MapInstance, MapSetupResult } from './mapConfig';

interface UseMapSetupOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  onMapLoad?: (map: MapInstance) => void;
}

export function useMapSetup({ containerRef, enabled, onMapLoad }: UseMapSetupOptions): MapSetupResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null); // Use state instead of ref so it triggers re-renders
  const mapRef = useRef<MapInstance | null>(null); // Keep ref for callbacks
  const scriptsLoadedRef = useRef(false);
  const skyConfiguredRef = useRef(false);

  // Load MapLibre scripts for web platform
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || scriptsLoadedRef.current) return;

    if (typeof window === 'undefined') return;

    // Check if already loaded
    if ((window as any).maplibregl) {
      scriptsLoadedRef.current = true;
      setLoading(false);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Hide attribution control
    const style = document.createElement('style');
    style.textContent = '.maplibregl-ctrl-attrib { display: none !important; }';
    document.head.appendChild(style);

    // Load JS
    const script = document.createElement('script');
    script.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
    script.onload = () => {
      scriptsLoadedRef.current = true;
      setLoading(false);
    };
    script.onerror = () => {
      const err = new Error('Failed to load MapLibre GL JS');
      setError(err);
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script tags on unmount
      const existingScript = document.querySelector(`script[src*="maplibre-gl"]`);
      const existingLink = document.querySelector(`link[href*="maplibre-gl"]`);
      if (existingScript) existingScript.remove();
      if (existingLink) existingLink.remove();
    };
  }, [enabled]);

  // Initialize map when scripts are loaded
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || loading || !containerRef.current || mapRef.current) {
      return;
    }

    const MapLibreGL = (window as any).maplibregl;
    if (!MapLibreGL) {
      // Scripts might still be loading, wait a bit
      const checkInterval = setInterval(() => {
        if ((window as any).maplibregl && containerRef.current && !mapRef.current) {
          clearInterval(checkInterval);
          // Retry initialization
          const event = new Event('retry-init');
          window.dispatchEvent(event);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    try {
      const map = new MapLibreGL.Map({
        container: containerRef.current,
        style: MapConfig.style,
        center: MapConfig.center as [number, number],
        zoom: MapConfig.zoom,
        pitch: MapConfig.pitch,
        bearing: MapConfig.bearing,
        minZoom: MapConfig.minZoom,
        maxZoom: MapConfig.maxZoom,
      });

      // Set projection to globe after style loads
      map.on('style.load', () => {
        map.setProjection({
          type: 'globe'
        });

        // Add sky configuration (only once)
        if (!skyConfiguredRef.current) {
          const style = map.getStyle();
          if (style && !style.sky) {
            style.sky = SKY_CONFIG;
            map.setStyle(style);
            skyConfiguredRef.current = true;
          }
        }

        // Add terrain source (FREE with MapTiler API key)
        if (MapConfig.terrain) {
          try {
            // Extract API key from style URL
            const apiKeyMatch = MapConfig.style.match(/key=([^&]+)/);
            const apiKey = apiKeyMatch ? apiKeyMatch[1] : '';
            
            if (!apiKey) {
              console.warn('MapTiler API key not found. Terrain will not be available.');
              return;
            }

            // Add terrain source using TileJSON endpoint (MapLibre handles this correctly)
            map.addSource('terrain-source', {
              type: 'raster-dem',
              url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${apiKey}`,
              tileSize: 256,
              maxzoom: 14
            });

            // Set terrain with exaggeration
            map.setTerrain({
              source: 'terrain-source',
              exaggeration: 1.5
            });

            console.log('✅ [TERRAIN] Terrain enabled successfully');
          } catch (error) {
            console.warn('⚠️ [TERRAIN] Could not enable terrain:', error);
          }
        }
      });

      map.on('load', () => {
        console.log('✅ [WEB] Map loaded successfully');
        // Map is ready for animations
        setLoading(false);
        // Notify that map is loaded
        if (onMapLoad && mapRef.current) {
          console.log('📞 [SETUP] Calling onMapLoad callback');
          onMapLoad(mapRef.current);
        }
      });

      map.on('error', (e: any) => {
        console.error('❌ [WEB] Map error:', e);
        setError(new Error(e.error?.message || 'Map initialization error'));
      });

      const mapInstance = map as MapInstance;
      mapRef.current = mapInstance;
      setMap(mapInstance); // Update state to trigger re-render
      console.log('🗺️ [SETUP] Map instance stored, has flyTo:', typeof (mapInstance as any).flyTo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize map');
      setError(error);
      setLoading(false);
    }
  }, [loading, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  return {
    map, // Return state value, not ref
    loading,
    error,
  };
}

