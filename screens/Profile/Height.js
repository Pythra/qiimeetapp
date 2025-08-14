import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const heightOptions = [
  "4'6\" (137 cm)", "4'7\" (140 cm)", "4'8\" (142 cm)", "4'9\" (145 cm)", "4'10\" (147 cm)", "4'11\" (150 cm)",
  "5'0\" (152 cm)", "5'1\" (155 cm)", "5'2\" (157 cm)", "5'3\" (160 cm)", "5'4\" (163 cm)", "5'5\" (165 cm)",
  "5'6\" (168 cm)", "5'7\" (170 cm)", "5'8\" (173 cm)", "5'9\" (175 cm)", "5'10\" (178 cm)", "5'11\" (180 cm)",
  "6'0\" (183 cm)", "6'1\" (185 cm)", "6'2\" (188 cm)", "6'3\" (191 cm)", "6'4\" (193 cm)", "6'5\" (196 cm)",
  "6'6\" (198 cm)", "6'7\" (201 cm)", "6'8\" (203 cm)", "6'9\" (206 cm)", "6'10\" (208 cm)", "6'11\" (211 cm)", "7'0\" (213 cm)",
  // Add more granular options as in AboutYouScreen
  "4'0\" (122 cm)", "4'1\" (124 cm)", "4'2\" (127 cm)", "4'3\" (130 cm)", "4'4\" (132 cm)", "4'5\" (135 cm)",
  "5'12\" (182 cm)", "7'1\" (216 cm)", "7'2\" (218 cm)", "7'3\" (221 cm)", "7'4\" (224 cm)", "7'5\" (226 cm)", "7'6\" (229 cm)"
];

const Height = ({ navigation }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="Height" onBack={() => navigation && navigation.goBack && navigation.goBack()} />
      <View style={styles.optionsArea}>
        {heightOptions.map((option, idx) => (
          <TouchableOpacity
            key={option}
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
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: selectedIndex === null ? '#292929' : '#ec066a' }]}
        disabled={selectedIndex === null}
        onPress={() => {
          if (selectedIndex !== null) {
            navigation.navigate('EditProfile', { height: heightOptions[selectedIndex] });
          }
        }}
      >
        <Text style={styles.doneButtonText}>Done</Text>
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
  doneButton: {
    backgroundColor: '#292929',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center', 
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '600',
  },
});

export default Height;