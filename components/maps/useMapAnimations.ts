import { useEffect, useRef } from 'react';
import { MapInstance, MapAnimationControls, ANIMATION_DURATIONS, MAP_VIEW, MapConfig } from './mapConfig';

interface UseMapAnimationsOptions {
  map: MapInstance | null;
  enabled: boolean;
}

export function useMapAnimations({ map, enabled }: UseMapAnimationsOptions): MapAnimationControls {
  // Use refs to store current values so closures always have latest values
  const mapRef = useRef<MapInstance | null>(null);
  const enabledRef = useRef(enabled);
  
  const rotationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentLocationIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    mapRef.current = map;
    enabledRef.current = enabled;
    console.log('🔄 [ANIMATIONS] Map ref updated:', !!map, 'enabled:', enabled);
  }, [map, enabled]);

  const startRotation = () => {
    const currentMap = mapRef.current;
    console.log('🔄 [ROTATION] startRotation called, map:', !!currentMap, 'interval:', !!rotationIntervalRef.current);
    if (!currentMap || rotationIntervalRef.current) {
      console.log('🔄 [ROTATION] Skipping - no map or already running');
      return;
    }

    const rotate = () => {
      const map = mapRef.current;
      if (!map) return;
      
      // Don't rotate if location animation is in progress
      if (isAnimatingRef.current) {
        console.log('🔄 [ROTATION] Skipping - location animation in progress');
        return;
      }
      
      console.log('🔄 [ROTATION] Executing rotateTo');
      try {
        map.rotateTo(360, { duration: ANIMATION_DURATIONS.FULL_ROTATION });
      } catch (e) {
        console.error('❌ [ROTATION] Error in rotateTo:', e);
      }
    };

    rotate(); // Start immediately
    rotationIntervalRef.current = setInterval(rotate, ANIMATION_DURATIONS.FULL_ROTATION);
    console.log('🔄 [ROTATION] Rotation started, interval ID:', rotationIntervalRef.current);
  };

  const stopRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
  };

  const flyToNextLocation = () => {
    const currentMap = mapRef.current;
    console.log('🌍 [FLYTO] flyToNextLocation called, map:', !!currentMap, 'isAnimating:', isAnimatingRef.current, 'locationIndex:', currentLocationIndexRef.current);
    
    if (!currentMap) {
      console.log('🌍 [FLYTO] No map, returning');
      return;
    }
    
    if (isAnimatingRef.current) {
      console.log('🌍 [FLYTO] Already animating, returning');
      return;
    }

    // Clear any old timeouts first to prevent interference
    locationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    locationTimeoutsRef.current = [];

    isAnimatingRef.current = true;
    const locationIndex = currentLocationIndexRef.current;
    const location = MapConfig.locations[locationIndex];
    console.log('🌍 [FLYTO] Flying to:', location.name, 'center:', location.center, 'index:', locationIndex);

    // Alternate between 120° and -120° for each flyTo
    const bearing = locationIndex % 2 === 0 
      ? MAP_VIEW.BEARINGS.POSITIVE 
      : MAP_VIEW.BEARINGS.NEGATIVE;

    // Fly to location with zoom and pitch animation
    const flyToOptions = {
      center: location.center as [number, number],
      zoom: MAP_VIEW.INITIAL_ZOOM,
      pitch: MAP_VIEW.PITCH,
      bearing: bearing,
      duration: ANIMATION_DURATIONS.LOCATION_FLIGHT,
      essential: true
    };
    console.log('🌍 [FLYTO] Calling map.flyTo with options:', flyToOptions);
    try {
      currentMap.flyTo(flyToOptions);
      console.log('🌍 [FLYTO] map.flyTo called successfully');
    } catch (e) {
      console.error('❌ [FLYTO] Error calling map.flyTo:', e);
      isAnimatingRef.current = false;
      return;
    }

    // After flyTo completes, increase zoom + change bearing
    const timeout1 = setTimeout(() => {
      const map = mapRef.current;
      if (!map || !isAnimatingRef.current) {
        isAnimatingRef.current = false;
        return;
      }
      
      console.log('🔍 Increasing zoom and changing bearing');
      
      const newBearing = bearing === MAP_VIEW.BEARINGS.POSITIVE 
        ? MAP_VIEW.BEARINGS.NEGATIVE 
        : MAP_VIEW.BEARINGS.POSITIVE;
      
      try {
        map.flyTo({
          center: location.center as [number, number],
          zoom: MAP_VIEW.ZOOM_IN,
          pitch: MAP_VIEW.PITCH,
          bearing: newBearing,
          duration: ANIMATION_DURATIONS.ZOOM_TRANSITION,
          essential: true
        });
      } catch (e) {
        console.error('❌ [FLYTO] Error in zoom in:', e);
        isAnimatingRef.current = false;
        return;
      }

      // After pause, zoom out 2 levels and flip bearing
      const timeout2 = setTimeout(() => {
        const map = mapRef.current;
        if (!map || !isAnimatingRef.current) {
          isAnimatingRef.current = false;
          return;
        }
        
        console.log('🔍 Zooming out 2 levels with bearing 60° or -60°');
        
        // Use 60° or -60° for zoom out (alternate based on location index)
        const finalBearing = locationIndex % 2 === 0 
          ? MAP_VIEW.BEARINGS.ZOOM_OUT_POSITIVE 
          : MAP_VIEW.BEARINGS.ZOOM_OUT_NEGATIVE;
        
        try {
          map.flyTo({
            center: location.center as [number, number],
            zoom: MAP_VIEW.ZOOM_OUT,
            pitch: MAP_VIEW.PITCH,
            bearing: finalBearing,
            duration: ANIMATION_DURATIONS.ZOOM_TRANSITION,
            essential: true
          });
        } catch (e) {
          console.error('❌ [FLYTO] Error in zoom out:', e);
          isAnimatingRef.current = false;
          return;
        }

        // Start next flyTo at ~90% of zoom out duration for seamless transition
        // This ensures next animation starts as zoom out is finishing
        const nextFlyToDelay = ANIMATION_DURATIONS.ZOOM_TRANSITION * 0.9;
        const timeout3 = setTimeout(() => {
          const map = mapRef.current;
          if (!map || !isAnimatingRef.current) {
            isAnimatingRef.current = false;
            return;
          }
          
          // Update location index
          const nextIndex = (locationIndex + 1) % MapConfig.locations.length;
          currentLocationIndexRef.current = nextIndex;
          
          // Clear animation flag BEFORE triggering next to prevent race condition
          isAnimatingRef.current = false;
          
          // Trigger next location animation for seamless transition
          console.log('✅ [FLYTO] Starting next location (index:', nextIndex, ') - seamless transition');
          flyToNextLocation();
        }, nextFlyToDelay);

        locationTimeoutsRef.current.push(timeout3);
      }, ANIMATION_DURATIONS.PAUSE_BETWEEN_ZOOMS);

      locationTimeoutsRef.current.push(timeout2);
    }, ANIMATION_DURATIONS.LOCATION_FLIGHT);

    locationTimeoutsRef.current.push(timeout1);
  };

  const startLocationCycle = () => {
    const currentMap = mapRef.current;
    console.log('📍 [LOCATION] startLocationCycle called, map:', !!currentMap, 'interval:', !!locationIntervalRef.current);
    if (!currentMap) {
      console.log('📍 [LOCATION] No map, returning');
      return;
    }
    if (locationIntervalRef.current) {
      console.log('📍 [LOCATION] Already running, returning');
      return;
    }

    // Start immediately - the cycle will continue automatically via flyToNextLocation callback
    console.log('📍 [LOCATION] Starting first flyTo');
    flyToNextLocation();
    
    // No interval needed - flyToNextLocation will trigger itself after completion
    console.log('📍 [LOCATION] Location cycle started (self-triggering)');
  };

  const stopLocationCycle = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    
    // Clear all pending timeouts to stop the chain
    locationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    locationTimeoutsRef.current = [];
    isAnimatingRef.current = false;
  };

  const startAnimations = () => {
    const currentMap = mapRef.current;
    const isEnabled = enabledRef.current;
    console.log('🎬 [ANIMATIONS] startAnimations called, map:', !!currentMap, 'enabled:', isEnabled);
    console.log('🎬 [ANIMATIONS] Map type:', typeof currentMap, 'has flyTo:', typeof (currentMap as any)?.flyTo);
    if (!currentMap) {
      console.error('❌ [ANIMATIONS] Cannot start - no map instance');
      return;
    }
    startRotation();
    startLocationCycle();
    console.log('🎬 [ANIMATIONS] startAnimations completed');
  };

  const stopAnimations = () => {
    stopRotation();
    stopLocationCycle();
  };

  // Start animations when map is ready
  useEffect(() => {
    if (!map || !enabled) {
      stopAnimations(); // Stop if disabled
      return;
    }

    // Set up load listener to start animations
    const handleLoad = () => {
      console.log('🎬 [ANIMATIONS] Map loaded event fired, starting animations');
      startAnimations();
    };

    // Register load event listener BEFORE checking if already loaded
    // This ensures we catch the event even if it fires immediately
    map.on('load', handleLoad);

    // Check if map is already loaded (in case load event already fired)
    // Use a small delay to let any pending load events fire first
    const timeoutId = setTimeout(() => {
      try {
        // Try to get style - if this works, map is likely loaded
        const style = (map as any).getStyle?.();
        if (style) {
          console.log('🎬 [ANIMATIONS] Map appears already loaded, starting animations immediately');
          startAnimations();
        } else {
          console.log('⏳ [ANIMATIONS] Map not ready yet, will start on load event');
        }
      } catch (e) {
        // Map not ready yet, will be handled by load event
        console.log('⏳ [ANIMATIONS] Map not ready yet, waiting for load event');
      }
    }, 100);

    return () => {
      stopAnimations();
      clearTimeout(timeoutId);
      // Note: MapLibre doesn't have off() method, but this is okay
      // as the map instance will be cleaned up separately
    };
  }, [map, enabled]);

  return {
    startAnimations,
    stopAnimations,
  };
}

