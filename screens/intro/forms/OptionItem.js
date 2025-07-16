import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Dimensions } from 'react-native';
import { FONTS } from '../../../constants/font';

const { width, height } = Dimensions.get('window');

const OptionItem = ({ label, selected, onPress }) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <Text style={styles.optionItemText}>{label}</Text>
    <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
      {selected && <View style={styles.radioButtonInner} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15, 
    backgroundColor: '#1E1E1E',
    marginBottom: 18,
    padding: 16,
    borderRadius: 8,
    height: height * 0.07,
  },
  optionItemText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  radioButton: {
    height: 16,
    width: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#EC066A',
    // Only border color changes, size remains the same
  },
  radioButtonInner: {
    height: 8,
    width: 8,
    borderRadius: 5,
    backgroundColor: '#EC066A',
    // Inner circle has fixed size regardless of selection
  },
});

export default OptionItem;