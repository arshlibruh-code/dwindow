import React, { useRef } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useMapSetup } from './useMapSetup';
import { useMapAnimations } from './useMapAnimations';
import WebViewMap from './WebViewMap';

interface MapsComponentProps {
  styles: any;
}

export default function MapsComponent({ styles }: MapsComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const animationControlsRef = useRef<{ startAnimations: () => void; stopAnimations: () => void } | null>(null);

  // Setup map (script loading + initialization)
  const { map, loading, error } = useMapSetup({
    containerRef: mapContainerRef,
    enabled: Platform.OS === 'web',
    onMapLoad: (loadedMap) => {
      // Start animations when map loads
      console.log('📞 [COMPONENT] onMapLoad called, animationControls available:', !!animationControlsRef.current);
      if (animationControlsRef.current) {
        console.log('🎬 [COMPONENT] Starting animations from map load callback');
        animationControlsRef.current.startAnimations();
      } else {
        console.warn('⚠️ [COMPONENT] Animation controls not ready yet, will retry');
        // Retry after a short delay
        setTimeout(() => {
          if (animationControlsRef.current) {
            console.log('🎬 [COMPONENT] Retrying animation start');
            animationControlsRef.current.startAnimations();
          }
        }, 200);
      }
    },
  });

  // Setup animations
  const animationControls = useMapAnimations({
    map,
    enabled: Platform.OS === 'web' && !!map,
  });

  // Store animation controls in ref so onMapLoad can access them
  React.useEffect(() => {
    animationControlsRef.current = animationControls;
  }, [animationControls]);

  // For native platforms, use WebView
  if (Platform.OS !== 'web') {
    return <WebViewMap styles={styles} />;
  }

  // For web platform, show loading or error states
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </View>
    );
  }

  // Render map container for web
  return (
    <View style={styles.container}>
      {/* @ts-ignore - We need a div for MapLibre GL JS on web */}
      <div
        ref={mapContainerRef as any}
        style={{
          width: '100%',
          height: '100%',
          ...styles.map
        }}
      />
    </View>
  );
}

