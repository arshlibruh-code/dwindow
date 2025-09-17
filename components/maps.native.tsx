import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NativeMapsProps {
  styles: any;
}

export default function NativeMapsComponent({ styles }: NativeMapsProps) {
  const [GoogleMaps, setGoogleMaps] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const { GoogleMaps: Maps } = await import('expo-maps');
        setGoogleMaps(Maps);
      } catch (error) {
        console.error('Failed to load expo-maps:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webText}>🗺️ Loading Map...</Text>
          <Text style={styles.webSubtext}>Loading Google Maps...</Text>
        </View>
      </View>
    );
  }

  if (!GoogleMaps) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webText}>❌ Map Error</Text>
          <Text style={styles.webSubtext}>Failed to load Google Maps</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleMaps.View
        style={styles.map}
        cameraPosition={{
          coordinates: { latitude: 37.78825, longitude: -122.4324 },
          zoom: 10
        }}
      />
    </View>
  );
}
