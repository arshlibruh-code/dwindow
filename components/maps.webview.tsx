import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { MapConfig } from '@/constants/MapConfig';

// WebView is only available on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.log('WebView not available');
  }
}

interface WebViewMapsProps {
  styles: any;
}

export default function WebViewMapsComponent({ styles }: WebViewMapsProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);

  // Web platform: Load MapLibre GL JS dynamically
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !maplibreLoaded) {
      // Load CSS
      const link = document.createElement('link');
      link.href = 'https://unpkg.com/maplibre-gl@5.7.2/dist/maplibre-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@5.7.2/dist/maplibre-gl.js';
      script.onload = () => setMaplibreLoaded(true);
      script.onerror = () => console.log('❌ [WEB] Failed to load MapLibre GL JS');
      document.head.appendChild(script);
    }
  }, [maplibreLoaded]);

  // Initialize map when MapLibre is loaded
  useEffect(() => {
    if (Platform.OS === 'web' && maplibreLoaded && mapContainer.current && !map.current) {
      const MapLibreGL = (window as any).maplibregl;
      
      if (MapLibreGL) {
        map.current = new MapLibreGL.Map({
          container: mapContainer.current,
          style: MapConfig.style,
          center: MapConfig.center,
          zoom: MapConfig.zoom,
          pitch: MapConfig.pitch,
          bearing: MapConfig.bearing,
          minZoom: MapConfig.minZoom,
          maxZoom: MapConfig.maxZoom
        });

        // Add globe control
        // map.current.addControl(new MapLibreGL.GlobeControl(), 'top-right');
        // TerrainControl doesn't exist in MapLibre GL JS
        // map.current.addControl(new MapLibreGL.NavigationControl(), 'top-right');

        // Set projection to globe after style loads
        map.current.on('style.load', () => {
          map.current.setProjection({
            type: 'globe'
          });
          
          // Add terrain source for 3D elevation
          // map.current.addSource('terrain', {
          //   type: 'raster-dem',
          //   url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=REPLACED_API_KEY',
          //   tileSize: 256,
          //   maxzoom: 14
          // });
          
          // Enable 3D terrain
          // map.current.setTerrain({
          //   source: 'terrain'
          // });
        });

        map.current.on('load', () => {
          console.log('✅ [WEB] Map loaded successfully');
          
          // Start permanent continuous rotation
          const startContinuousRotation = () => {
            map.current.rotateTo(360, { duration: 80000 }); // 80 second full rotation (20 * 4)
            setTimeout(startContinuousRotation, 80000); // Restart rotation
          };
          startContinuousRotation();
          
          // Start location cycling
          let currentLocationIndex = 0;
          
          const flyToNextLocation = () => {
            const location = MapConfig.locations[currentLocationIndex];
            console.log('🌍 [WEB] Flying to:', location.name);
            
            // Alternate between 120° and -120° for each flyTo
            const bearing = currentLocationIndex % 2 === 0 ? 120 : -120;
            
            // Fly to location with zoom and pitch animation
            map.current.flyTo({
              center: location.center,
              zoom: 11,
              pitch: 65,
              bearing: bearing,
              duration: 30000,
              essential: true
            });
            
            // After flyTo completes, increase zoom + change bearing
            setTimeout(() => {
              console.log('🔍 [WEB] Increasing zoom and changing bearing');
              
              // Increase zoom by 1 level and change bearing
              const newBearing = bearing === 120 ? -120 : 120; // Flip bearing
              
              map.current.flyTo({
                center: location.center,
                zoom: 12, // +1 zoom level
                pitch: 65,
                bearing: newBearing,
                duration: 2000, // Quick transition
                essential: true
              });
              
              // After 5 second pause, zoom out 2 levels and change bearing again
              setTimeout(() => {
                console.log('🔍 [WEB] Zooming out 2 levels and changing bearing');
                
                // Zoom out 2 levels and flip bearing again
                const finalBearing = newBearing === 120 ? -120 : 120; // Flip bearing again
                
                map.current.flyTo({
                  center: location.center,
                  zoom: 10, // 12 - 2 = 10 (zoom out 2 levels)
                  pitch: 65,
                  bearing: finalBearing,
                  duration: 2000, // Quick transition
                  essential: true
                });
                
                // After zoom out, move to next location
                setTimeout(() => {
                  currentLocationIndex = (currentLocationIndex + 1) % MapConfig.locations.length;
                }, 2000);
                
              }, 5000);
              
            }, 30000); // Wait for initial flyTo to complete
          };
          
          // Start cycling - fly to first location immediately
          flyToNextLocation();
          
          // Then cycle every 39 seconds (30s flight + 2s zoom in + 5s pause + 2s zoom out = 39s total)
          setInterval(flyToNextLocation, 39000);
        });
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [maplibreLoaded]);

  // For web platform, use MapLibre GL JS directly
  if (Platform.OS === 'web') {
    if (!maplibreLoaded) {
      return (
        <View style={styles.container}>
          <View style={styles.webFallback}>
            <Text style={styles.webText}>Loading map...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {/* @ts-ignore - We need a div for MapLibre GL JS on web */}
        <div
          ref={mapContainer as any}
          style={{
            width: '100%',
            height: '100%',
            ...styles.map
          }}
        />
      </View>
    );
  }

  // For native platforms, use WebView
  if (!WebView) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webText}>WebView not available</Text>
        </View>
      </View>
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.7.2/dist/maplibre-gl.css" />
      <script src="https://unpkg.com/maplibre-gl@5.7.2/dist/maplibre-gl.js"></script>
      <script>
        const MapConfig = ${JSON.stringify(MapConfig)};
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
          background: radial-gradient(circle at center,rgb(5, 0, 31),rgb(0, 0, 1));
        }
        
        /* Scale attribution control to 3x smaller */
        .maplibregl-ctrl-attrib {
          display: none;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        console.log('�� [WEBVIEW] Starting map initialization...');
        
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
            
            // Add navigation control
            // map.addControl(new maplibregl.NavigationControl(), 'top-right');
            
            // Set projection to globe after style loads
            map.on('style.load', function() {
              map.setProjection({
                type: 'globe'
              });
              
              // Add terrain source for 3D elevation
              // map.addSource('terrain', {
              //   type: 'raster-dem',
              //   url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=REPLACED_API_KEY',
              //   tileSize: 256,
              //   maxzoom: 14
              // });
              
              // Enable 3D terrain
              // map.setTerrain({
              //   source: 'terrain',
              //   exaggeration: 2
              // });
            });
            
            map.on('load', function() {
              console.log('✅ Map loaded successfully!');
              
              // Start permanent continuous rotation
              const startContinuousRotation = () => {
                map.rotateTo(360, { duration: 80000 }); // 80 second full rotation
                setTimeout(startContinuousRotation, 80000); // Restart rotation
              };
              startContinuousRotation();
              
              // Start location cycling
              let currentLocationIndex = 0;
              
              const flyToNextLocation = () => {
                const location = MapConfig.locations[currentLocationIndex];
                console.log('🌍 Flying to:', location.name);
                
                // Alternate between 120° and -120° for each flyTo
                const bearing = currentLocationIndex % 2 === 0 ? 120 : -120;
                
                // Fly to location with zoom and pitch animation
                map.flyTo({
                  center: location.center,
                  zoom: 11,
                  pitch: 65,
                  bearing: bearing,
                  duration: 30000,
                  essential: true
                });
                
                // After flyTo completes, increase zoom + change bearing
                setTimeout(() => {
                  console.log('🔍 Increasing zoom and changing bearing');
                  
                  // Increase zoom by 1 level and change bearing
                  const newBearing = bearing === 120 ? -120 : 120; // Flip bearing
                  
                  map.flyTo({
                    center: location.center,
                    zoom: 12, // +1 zoom level
                    pitch: 65,
                    bearing: newBearing,
                    duration: 2000, // Quick transition
                    essential: true
                  });
                  
                  // After 5 second pause, zoom out 2 levels and change bearing again
                  setTimeout(() => {
                    console.log('🔍 Zooming out 2 levels and changing bearing');
                    
                    // Zoom out 2 levels and flip bearing again
                    const finalBearing = newBearing === 120 ? -120 : 120; // Flip bearing again
                    
                    map.flyTo({
                      center: location.center,
                      zoom: 10, // 12 - 2 = 10 (zoom out 2 levels)
                      pitch: 65,
                      bearing: finalBearing,
                      duration: 2000, // Quick transition
                      essential: true
                    });
                    
                    // After zoom out, move to next location
                    setTimeout(() => {
                      currentLocationIndex = (currentLocationIndex + 1) % MapConfig.locations.length;
                    }, 2000);
                    
                  }, 5000);
                  
                }, 30000); // Wait for initial flyTo to complete
              };
              
              // Start cycling - fly to first location immediately
              flyToNextLocation();
              
              // Then cycle every 39 seconds (30s flight + 2s zoom in + 5s pause + 2s zoom out = 39s total)
              setInterval(flyToNextLocation, 39000);
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
