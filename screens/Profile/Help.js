import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const helpOptions = [
  { label: 'Contact' },
  { label: 'Support' },
  { label: 'FAQs' },
];

const Help = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopHeader title="Help" onBack={() => navigation.goBack()} />
      <View style={styles.optionsContainer}>
        {helpOptions.map((option, idx) => (
          <TouchableOpacity
            key={option.label}
            style={[styles.optionRow, idx !== 0 && { marginTop: 16 }]}
            activeOpacity={1}
            onPress={
              option.label === 'FAQs' 
                ? () => navigation.navigate('FAQs') 
                : option.label === 'Support'
                ? () => navigation.navigate('ReportDetails', {
                    reason: 'Support Request',
                    reportType: 'Report'
                  })
                : undefined
            }
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <MaterialIcons name="keyboard-arrow-right" size={28} color="#888" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
});

export default Help;

