import React from 'react';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'link' | 'default';
}

export function ThemedText({ type = 'default', style, ...props }: ThemedTextProps) {
  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 24, fontWeight: 'bold', color: '#333' };
      case 'link':
        return { fontSize: 16, color: '#007AFF', textDecorationLine: 'underline' };
      default:
        return { fontSize: 16, color: '#333' };
    }
  };

  return <Text style={[getTextStyle(), style]} {...props} />;
}
