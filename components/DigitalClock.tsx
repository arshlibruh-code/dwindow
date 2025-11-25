import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useFonts } from 'expo-font';

// Font configuration
const FONTS = [
  { 
    name: 'Quantico-Bold', 
    displayName: 'Quantico',
    webFont: 'Quantico:wght@700',
    file: require('../assets/fonts/Quantico-Bold.ttf'),
    fontSize: 74
  },
  { 
    name: 'Audiowide-Regular', 
    displayName: 'Audiowide',
    webFont: 'Audiowide',
    file: require('../assets/fonts/Audiowide-Regular.ttf'),
    fontSize: 80
  },
  { 
    name: 'ChakraPetch-Bold', 
    displayName: 'Chakra Petch',
    webFont: 'Chakra+Petch:wght@700',
    file: require('../assets/fonts/ChakraPetch-Bold.ttf'),
    fontSize: 80
  },
  { 
    name: 'Orbitron-Variable', 
    displayName: 'Orbitron',
    webFont: 'Orbitron:wght@700',
    file: require('../assets/fonts/Orbitron-VariableFont_wght.ttf'),
    fontSize: 78
  },
  { 
    name: 'SpaceMono-BoldItalic', 
    displayName: 'Space Mono',
    webFont: 'Space+Mono:wght@700&style=italic',
    file: require('../assets/fonts/SpaceMono-BoldItalic.ttf'),
    fontSize: 74
  },
  { 
    name: 'TurretRoad-Bold', 
    displayName: 'Turret Road',
    webFont: 'Turret+Road:wght@700',
    file: require('../assets/fonts/TurretRoad-Bold.ttf'),
    fontSize: 96
  },
  { 
    name: 'ZenDots-Regular', 
    displayName: 'Zen Dots',
    webFont: 'Zen+Dots',
    file: require('../assets/fonts/ZenDots-Regular.ttf'),
    fontSize: 80
  },
  { 
    name: 'GoogleSansFlex-Variable', 
    displayName: 'Google Sans Flex',
    webFont: 'Google+Sans+Flex:wght@700',
    file: require('../assets/fonts/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf'),
    fontSize: 92
  },
  { 
    name: 'StackSansText-Variable', 
    displayName: 'Stack Sans',
    webFont: 'Stack+Sans+Text:wght@700',
    file: require('../assets/fonts/StackSansText-VariableFont_wght.ttf'),
    fontSize: 70
  },
  { 
    name: 'ScienceGothic-Variable', 
    displayName: 'Science Gothic',
    webFont: 'Science+Gothic:wght@700',
    file: require('../assets/fonts/ScienceGothic-VariableFont_CTRS,slnt,wdth,wght.ttf'),
    fontSize: 64
  },
];

// Static data - moved outside component to avoid recreation on every render
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Build font map for native platforms - computed once
const NATIVE_FONT_MAP = FONTS.reduce((acc, font) => {
  acc[font.name] = font.file;
  return acc;
}, {} as Record<string, any>);

// Track loaded fonts on web to prevent duplicates
let webFontsLoaded = false;

export default function DigitalClock() {
  const [time, setTime] = useState(new Date());
  const [currentFontIndex, setCurrentFontIndex] = useState(0);
  const [is24Hour, setIs24Hour] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isTimeFormatFocused, setIsTimeFormatFocused] = useState(false);
  
  // Load all fonts for native platforms
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web' 
      ? {}
      : NATIVE_FONT_MAP
  );

  // Load Google Fonts for web with proper cleanup
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && !webFontsLoaded) {
      const links: HTMLLinkElement[] = [];
      
      // Load all fonts
      FONTS.forEach(font => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${font.webFont}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        links.push(link);
      });
      
      webFontsLoaded = true;
      
      // Cleanup function
      return () => {
        links.forEach(link => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        });
        webFontsLoaded = false;
      };
    }
  }, []);

  // Timer effect with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const cycleFont = () => {
    setCurrentFontIndex((prev) => (prev + 1) % FONTS.length);
  };

  const toggleTimeFormat = () => {
    setIs24Hour((prev) => !prev);
  };

  const formatTime = (date: Date) => {
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    if (is24Hour) {
      const hours = date.getHours().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } else {
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const hoursStr = hours.toString().padStart(2, '0');
      return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
    }
  };

  const formatDate = (date: Date) => {
    const day = DAYS[date.getDay()];
    const dayNum = date.getDate().toString().padStart(2, '0');
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear().toString();
    
    return `${day} ${dayNum} ${month} ${year}`;
  };

  // Memoize computed values
  const currentFont = useMemo(() => FONTS[currentFontIndex], [currentFontIndex]);
  
  const fontFamily = useMemo(() => {
    return Platform.OS === 'web' 
      ? currentFont.displayName
      : currentFont.name;
  }, [currentFont]);

  const formattedTime = useMemo(() => formatTime(time), [time, is24Hour]);
  const formattedDate = useMemo(() => formatDate(time), [time]);

  // Wait for fonts to load on native platforms
  if (Platform.OS !== 'web' && !fontsLoaded) {
    return null;
  }

  return (
    <>
      {/* Font Cycle Button */}
      <Pressable
        style={[
          styles.fontButton,
          isFocused && styles.fontButtonFocused
        ]}
        onPress={cycleFont}
        focusable={true}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tvParallaxProperties={{ magnification: 1.1 }}
        accessibilityLabel="Cycle font style"
        accessibilityRole="button"
        accessibilityHint="Changes the font style of the clock"
      >
        <Text style={styles.fontButtonText}>Aa</Text>
      </Pressable>

      {/* Time Format Toggle Button */}
      <Pressable
        style={[
          styles.timeFormatButton,
          isTimeFormatFocused && styles.timeFormatButtonFocused
        ]}
        onPress={toggleTimeFormat}
        focusable={true}
        onFocus={() => setIsTimeFormatFocused(true)}
        onBlur={() => setIsTimeFormatFocused(false)}
        tvParallaxProperties={{ magnification: 1.1 }}
        accessibilityLabel={`Switch to ${is24Hour ? '12' : '24'} hour format`}
        accessibilityRole="button"
        accessibilityHint="Toggles between 12 and 24 hour time format"
      >
        <Text style={styles.timeFormatButtonText}>{is24Hour ? '24' : '12'}</Text>
      </Pressable>

      {/* Clock Wrapper for Centering */}
      <View style={styles.clockWrapper}>
        <View 
          style={[
            styles.container,
            Platform.OS === 'web' && {
              backdropFilter: 'blur(20px)',
              transition: '0.6s ease-in-out',
            } as any,
          ]}
        >
          <Text 
            style={[
              styles.timeText,
              { 
                fontFamily,
                fontSize: currentFont.fontSize,
                lineHeight: currentFont.fontSize * 0.95
              },
              Platform.OS === 'web' && {
                transition: '0.6s ease-in-out',
              } as any,
            ]}
            accessibilityLabel={`Current time: ${formattedTime}`}
            accessibilityRole="text"
          >
            {formattedTime}
          </Text>
          <Text 
            style={[
              styles.dateText,
              { fontFamily },
              Platform.OS === 'web' && {
                transition: '0.02s ease-out',
              } as any,
            ]}
            accessibilityLabel={`Current date: ${formattedDate}`}
            accessibilityRole="text"
          >
            {formattedDate}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  clockWrapper: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'transparent',
    paddingTop: 10,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: Platform.select({
      web: '100vw' as any,
      default: '100%',
    }),
  },
  timeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  fontButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Platform.select({
      web: 1000,
      default: undefined,
    }),
  },
  fontButtonFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 3,
  },
  fontButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeFormatButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Platform.select({
      web: 1000,
      default: undefined,
    }),
  },
  timeFormatButtonFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 3,
  },
  timeFormatButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
