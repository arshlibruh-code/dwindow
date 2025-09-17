import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WebMapsProps {
  styles: any;
}

// Mapbox for web - using direct mapbox-gl
let MapboxGL: any = null;
if (typeof window !== 'undefined') {
  try {
    // Load Mapbox CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    MapboxGL = require('mapbox-gl');
    MapboxGL.accessToken = 'pk.eyJ1Ijoic2FpdGVqYXVzIiwiYSI6ImNrM2R5emU5cTFmcHYzaXBkbzZzcjE1enkifQ.wB24J_XpAwaarHM1fmJ4Xw';
  } catch (e) {
    console.log('Mapbox not available for web');
  }
}

export default function WebMapsComponent({ styles }: WebMapsProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (MapboxGL && mapContainer.current && !map.current) {
      map.current = new MapboxGL.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4324, 37.78825],
        zoom: 10
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (!MapboxGL) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webText}>🗺️ Map View</Text>
          <Text style={styles.webSubtext}>Mapbox loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          ...styles.map
        }}
      />
    </View>
  );
}
