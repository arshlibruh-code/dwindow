import React from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { useScale } from '@/hooks/useScale';

// Map component
import MapsComponent from '../components/maps/MapsComponent';
import DigitalClock from '../components/DigitalClock';

export default function HomeScreen() {
  const scale = useScale();
  const styles = useHomeScreenStyles(scale);

  console.log(`🚀 [${Platform.OS.toUpperCase()}] HomeScreen loaded - Platform: ${Platform.OS}`);

  // WebView + Leaflet for both web and native with digital clock overlay
  return (
    <View style={styles.container}>
      <MapsComponent styles={styles} />
      <DigitalClock />
    </View>
  );
}

const useHomeScreenStyles = (scale: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(20px)',
    zIndex: 9999,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webText: {
    fontSize: 24 * scale,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  webSubtext: {
    fontSize: 16 * scale,
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
});
