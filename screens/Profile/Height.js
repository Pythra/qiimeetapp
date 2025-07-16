import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const heightOptions = [
  { label: `5'2" (157 cm)`, value: '5_2' },
  { label: `5'6" (168 cm)`, value: '5_6' },
];

const Height = ({ navigation }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="Height" onBack={() => navigation && navigation.goBack && navigation.goBack()} />
      <View style={styles.optionsArea}>
        {heightOptions.map((option, idx) => (
          <TouchableOpacity
            key={option.value}
            style={styles.heightOption}
            activeOpacity={0.7}
            onPress={() => setSelectedIndex(idx)}
          >
            <Text
              style={[
                styles.heightText,
                {
                  color: selectedIndex === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: selectedIndex === idx ? '500' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Select your height</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
    paddingTop: 32,
  },
  optionsArea: {  
    width: '100%',
    alignItems: 'center',
    minHeight: 120,
  },
  heightOption: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heightText: {
    fontSize: 20,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center', 
    width: '90%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '600',
  },
});

export default Height;