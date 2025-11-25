import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MapConfig, MAPLIBRE_VERSION, SKY_CONFIG, ANIMATION_DURATIONS, MAP_VIEW } from './mapConfig';

interface WebViewMapProps {
  styles: any;
}

export default function WebViewMap({ styles }: WebViewMapProps) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css" />
      <script src="https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js"></script>
      <script>
        const MapConfig = ${JSON.stringify(MapConfig)};
        const SKY_CONFIG = ${JSON.stringify(SKY_CONFIG)};
        const ANIMATION_DURATIONS = ${JSON.stringify(ANIMATION_DURATIONS)};
        const MAP_VIEW = ${JSON.stringify(MAP_VIEW)};
      </script>
      <style>
        body { 
          padding: 0; 
          margin: 0; 
          font-family: Quantico, sans-serif;
        }
        #map { 
          height: 100vh; 
          width: 100vw; 
          background: radial-gradient(circle at center,rgb(26, 0, 154),rgb(0, 0, 169));
        }
        .maplibregl-ctrl-attrib {
          display: none;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        console.log('🚀 [WEBVIEW] Starting map initialization...');
        
        if (typeof maplibregl === 'undefined') {
          console.log('❌ MapLibre GL not loaded!');
        } else {
          console.log('✅ MapLibre GL loaded');
          
          try {
            var map = new maplibregl.Map({
              container: 'map',
              style: MapConfig.style,
              center: MapConfig.center,
              zoom: MapConfig.zoom,
              pitch: MapConfig.pitch,
              bearing: MapConfig.bearing,
              minZoom: MapConfig.minZoom,
              maxZoom: MapConfig.maxZoom
            });
            
            var skyConfigured = false;
            var rotationInterval = null;
            var locationInterval = null;
            var locationTimeouts = [];
            var currentLocationIndex = 0;
            var isAnimating = false;
            
            // Set projection to globe after style loads
            map.on('style.load', function() {
              map.setProjection({
                type: 'globe'
              });
              
              // Add sky configuration (only once)
              if (!skyConfigured) {
                var style = map.getStyle();
                if (style && !style.sky) {
                  style.sky = SKY_CONFIG;
                  map.setStyle(style);
                  skyConfigured = true;
                }
              }

              // Add terrain source (FREE with MapTiler API key)
              if (MapConfig.terrain) {
                try {
                  // Extract API key from style URL
                  var apiKeyMatch = MapConfig.style.match(/key=([^&]+)/);
                  var apiKey = apiKeyMatch ? apiKeyMatch[1] : '';
                  
                  if (!apiKey) {
                    console.warn('MapTiler API key not found. Terrain will not be available.');
                    return;
                  }

                  // Add terrain source using TileJSON endpoint (MapLibre handles this correctly)
                  map.addSource('terrain-source', {
                    type: 'raster-dem',
                    url: 'https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=' + apiKey,
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
                  console.log('⚠️ [TERRAIN] Could not enable terrain: ' + error.message);
                }
              }
            });
            
            map.on('load', function() {
              console.log('✅ Map loaded successfully!');
              
              // Start permanent continuous rotation
              const startRotation = () => {
                // Don't rotate if location animation is in progress
                if (isAnimating) {
                  console.log('🔄 [ROTATION] Skipping - location animation in progress');
                  return;
                }
                map.rotateTo(360, { duration: ANIMATION_DURATIONS.FULL_ROTATION });
              };
              
              startRotation();
              rotationInterval = setInterval(startRotation, ANIMATION_DURATIONS.FULL_ROTATION);
              
              // Start location cycling
              const flyToNextLocation = () => {
                console.log('🌍 [FLYTO] flyToNextLocation called, isAnimating:', isAnimating, 'locationIndex:', currentLocationIndex);
                
                if (isAnimating) {
                  console.log('🌍 [FLYTO] Already animating, returning');
                  return;
                }
                
                // Clear any old timeouts first to prevent interference
                locationTimeouts.forEach(timeout => clearTimeout(timeout));
                locationTimeouts = [];
                
                isAnimating = true;
                const locationIndex = currentLocationIndex;
                const location = MapConfig.locations[locationIndex];
                console.log('🌍 Flying to:', location.name, 'index:', locationIndex);
                
                const bearing = locationIndex % 2 === 0 
                  ? MAP_VIEW.BEARINGS.POSITIVE 
                  : MAP_VIEW.BEARINGS.NEGATIVE;
                
                map.flyTo({
                  center: location.center,
                  zoom: MAP_VIEW.INITIAL_ZOOM,
                  pitch: MAP_VIEW.PITCH,
                  bearing: bearing,
                  duration: ANIMATION_DURATIONS.LOCATION_FLIGHT,
                  essential: true
                });
                
                const timeout1 = setTimeout(() => {
                  if (!isAnimating) return;
                  
                  console.log('🔍 Increasing zoom and changing bearing');
                  
                  const newBearing = bearing === MAP_VIEW.BEARINGS.POSITIVE 
                    ? MAP_VIEW.BEARINGS.NEGATIVE 
                    : MAP_VIEW.BEARINGS.POSITIVE;
                  
                  try {
                    map.flyTo({
                      center: location.center,
                      zoom: MAP_VIEW.ZOOM_IN,
                      pitch: MAP_VIEW.PITCH,
                      bearing: newBearing,
                      duration: ANIMATION_DURATIONS.ZOOM_TRANSITION,
                      essential: true
                    });
                  } catch (e) {
                    console.error('❌ [FLYTO] Error in zoom in:', e);
                    isAnimating = false;
                    return;
                  }
                  
                  const timeout2 = setTimeout(() => {
                    if (!isAnimating) return;
                    
                    console.log('🔍 Zooming out 2 levels with bearing 60° or -60°');
                    
                    // Use 60° or -60° for zoom out (alternate based on location index)
                    const finalBearing = locationIndex % 2 === 0 
                      ? MAP_VIEW.BEARINGS.ZOOM_OUT_POSITIVE 
                      : MAP_VIEW.BEARINGS.ZOOM_OUT_NEGATIVE;
                    
                    try {
                      map.flyTo({
                        center: location.center,
                        zoom: MAP_VIEW.ZOOM_OUT,
                        pitch: MAP_VIEW.PITCH,
                        bearing: finalBearing,
                        duration: ANIMATION_DURATIONS.ZOOM_TRANSITION,
                        essential: true
                      });
                    } catch (e) {
                      console.error('❌ [FLYTO] Error in zoom out:', e);
                      isAnimating = false;
                      return;
                    }
                    
                    // Start next flyTo at ~90% of zoom out duration for seamless transition
                    // This ensures next animation starts as zoom out is finishing
                    const nextFlyToDelay = ANIMATION_DURATIONS.ZOOM_TRANSITION * 0.9;
                    const timeout3 = setTimeout(() => {
                      if (!isAnimating) return;
                      
                      // Update location index
                      const nextIndex = (locationIndex + 1) % MapConfig.locations.length;
                      currentLocationIndex = nextIndex;
                      
                      // Clear animation flag BEFORE triggering next
                      isAnimating = false;
                      
                      // Trigger next location animation for seamless transition
                      console.log('✅ [FLYTO] Starting next location (index:', nextIndex, ') - seamless transition');
                      flyToNextLocation();
                    }, nextFlyToDelay);
                    
                    locationTimeouts.push(timeout3);
                  }, ANIMATION_DURATIONS.PAUSE_BETWEEN_ZOOMS);
                  
                  locationTimeouts.push(timeout2);
                }, ANIMATION_DURATIONS.LOCATION_FLIGHT);
                
                locationTimeouts.push(timeout1);
              };
              
              // Start cycling - fly to first location immediately (self-triggering chain)
              flyToNextLocation();
            });
            
            map.on('error', function(e) {
              console.log('❌ Map error: ' + e.error.message);
            });
            
          } catch (error) {
            console.log('❌ Error creating map: ' + error.message);
          }
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoadEnd={() => console.log('✅ [TV] Map loaded successfully')}
        onError={(error: any) => console.log('❌ [TV] Map error:', error)}
      />
    </View>
  );
}

