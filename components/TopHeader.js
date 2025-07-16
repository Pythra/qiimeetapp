import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/font';

const TopHeader = ({ title, onBack, close }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
      {close ? (
        <Ionicons name="close" size={24} color="#FFFFFF" />
      ) : (
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      )}
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 24,
    paddingBottom:18,
    backgroundColor: 'transparent',
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default TopHeader;
