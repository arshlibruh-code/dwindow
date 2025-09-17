import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { useScale } from '@/hooks/useScale';

// Platform-specific map components
import WebMapsComponent from '../components/maps.web';
import NativeMapsComponent from '../components/maps.native';

export default function HomeScreen() {
  const scale = useScale();
  const styles = useHomeScreenStyles(scale);

  // Web: Use Mapbox
  if (Platform.OS === 'web') {
    return <WebMapsComponent styles={styles} />;
  }

  // Native: Use expo-maps (Google Maps)
  return <NativeMapsComponent styles={styles} />;
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
    backgroundColor: '#f0f0f0',
    padding: 20,
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
