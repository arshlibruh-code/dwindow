import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

// WebView is only available on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.log('WebView not available');
  }
}

// MapLibre GL JS for web - we'll load it dynamically in useEffect

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
      link.href = 'https://unpkg.com/maplibre-gl@4.7.0/dist/maplibre-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@4.7.0/dist/maplibre-gl.js';
      script.onload = () => {
        setMaplibreLoaded(true);
      };
      script.onerror = () => {
        console.log('❌ [WEB] Failed to load MapLibre GL JS');
      };
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
          style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap Liberty style
          center: [-122.4324, 37.78825], // San Francisco
          zoom: 10
        });

        map.current.on('load', () => {
          console.log('✅ [WEB] Map loaded successfully');
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
            <Text style={styles.webText}>🗺️ Map View</Text>
            <Text style={styles.webSubtext}>San Francisco, CA</Text>
            <Text style={styles.webSubtext}>Loading map...</Text>
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

  // For native platforms, use WebView with OpenFreeMap
  if (!WebView) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webText}>🗺️ Map View</Text>
          <Text style={styles.webSubtext}>WebView not available</Text>
          <Text style={styles.webSubtext}>Need to rebuild with WebView</Text>
        </View>
      </View>
    );
  }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.0/dist/maplibre-gl.css" />
          <script src="https://unpkg.com/maplibre-gl@4.7.0/dist/maplibre-gl.js"></script>
          <style>
            body { 
              padding: 0; 
              margin: 0; 
              font-family: Arial, sans-serif;
              background: #f0f0f0;
            }
            #map { 
              height: 100vh; 
              width: 100vw; 
              background: #e0e0e0;
            }
            .info {
              position: absolute;
              top: 10px;
              left: 10px;
              background: white;
              padding: 10px;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              z-index: 1000;
              font-size: 14px;
            }
            .debug {
              position: absolute;
              bottom: 10px;
              left: 10px;
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 10px;
              border-radius: 5px;
              font-size: 12px;
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          <div class="info">
            <strong>🗺️ OpenFreeMap</strong><br>
            San Francisco, CA<br>
            Platform: ${Platform.OS}
          </div>
          <div id="map"></div>
          <div class="debug" id="debug"></div>
          <script>
            console.log('🚀 [WEBVIEW] Starting map initialization...');
            
            function updateDebug(message) {
              const debug = document.getElementById('debug');
              if (debug) {
                debug.innerHTML += message + '<br>';
              }
              console.log('🐛 [WEBVIEW] ' + message);
            }
            
            updateDebug('Checking MapLibre GL...');
            
            if (typeof maplibregl === 'undefined') {
              updateDebug('❌ MapLibre GL not loaded!');
            } else {
              updateDebug('✅ MapLibre GL loaded');
              
              try {
                updateDebug('Creating map...');
                var map = new maplibregl.Map({
                  container: 'map',
                  style: 'https://tiles.openfreemap.org/styles/liberty',
                  center: [-122.4324, 37.78825], // San Francisco
                  zoom: 10
                });
                
                map.on('load', function() {
                  updateDebug('✅ Map loaded successfully!');
                  
                  // Add a marker
                  new maplibregl.Marker()
                    .setLngLat([-122.4324, 37.78825])
                    .setPopup(new maplibregl.Popup().setHTML('<b>San Francisco</b><br>Welcome to OpenFreeMap!'))
                    .addTo(map);
                  
                  updateDebug('✅ Markers added');
                });
                
                map.on('error', function(e) {
                  updateDebug('❌ Map error: ' + e.error.message);
                });
                
              } catch (error) {
                updateDebug('❌ Error creating map: ' + error.message);
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
        onLoadEnd={() => {
          console.log('✅ [TV] Map loaded successfully');
        }}
        onError={(error: any) => {
          console.log('❌ [TV] Map error:', error);
        }}
      />
    </View>
  );
}
