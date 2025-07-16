import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 48;

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Successful', value: 'successful' },
  { label: 'Failed', value: 'failed' },
];

const months = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
];
const years = ['2023', '2024', '2025'];

const ReSubscribeScreen = ({ navigation }) => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('04');
  const [selectedYear, setSelectedYear] = useState('2025');

  const monthScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  // Picker logic (copied/adapted from DateOfBirthScreen)
  const renderPickerColumn = (data, selectedValue, onValueChange, scrollRef) => {
    const handleScroll = (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const newValue = data[index];
      if (newValue && newValue !== selectedValue) {
        onValueChange(newValue);
      }
    };

    React.useEffect(() => {
      setTimeout(() => {
        const index = data.indexOf(selectedValue);
        if (index !== -1 && scrollRef.current) {
          scrollRef.current.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);
    }, []);

    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollRef}
          style={styles.picker}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
        >
          {data.map((item, index) => {
            const selectedIndex = data.indexOf(selectedValue);
            const isSelected = item === selectedValue;
            const isAdjacent = Math.abs(index - selectedIndex) === 1;
            return (
              <View key={index} style={styles.pickerItem}>
                <Text
                  style={[
                    styles.pickerText,
                    isSelected && styles.pickerTextSelected,
                    isAdjacent && styles.pickerTextAdjacent
                  ]}
                >
                  {item}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.selectionIndicator} pointerEvents="none">
          <View style={styles.selectionLine} />
          <View style={[styles.selectionLine, { bottom: 0 }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Status</Text>
        {statusOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.radioRow,
              selectedStatus === opt.value && styles.radioRowActive
            ]}
            onPress={() => setSelectedStatus(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.radioLabel}>{opt.label}</Text>
            <View style={[
              styles.radioOuter,
              selectedStatus === opt.value && styles.radioOuterActive
            ]}>
              {selectedStatus === opt.value && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Date</Text>
        <View style={styles.pickerRow}>
          {renderPickerColumn(months, selectedMonth, setSelectedMonth, monthScrollRef)}
          {renderPickerColumn(years, selectedYear, setSelectedYear, yearScrollRef)}
        </View>
      </View>

      {/* Apply Button */}
      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerLeft: {
    padding: 4,
    paddingRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    flex: 1, 
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginTop: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center', 
    backgroundColor: '#181818',
  },
  radioOuterActive: {
    borderColor: '#ec066a',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#ec066a',
  },
  radioLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  pickerRow: {
    flexDirection: 'row',
    height: ITEM_HEIGHT * 5,
    width: width * 0.7,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  pickerColumn: {
    flex: 1,
    position: 'relative',
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '400',
  },
  pickerTextSelected: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 24,
    fontFamily: FONTS.regular,
    backgroundColor: '#232323',
    paddingHorizontal: 16,
    height: ITEM_HEIGHT,
    textAlignVertical: 'center',
    textAlign: 'center',
    lineHeight: ITEM_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerTextAdjacent: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
    fontSize: 24,
    fontFamily: FONTS.regular,
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    justifyContent: 'space-between',
  },
  selectionLine: {
    height: 1,
    backgroundColor: 'transparent',
    width: '80%',
    alignSelf: 'center',
  },
  applyButton: {
    backgroundColor: '#ec066a',
    borderRadius: 90,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 56,
    marginTop: 'auto',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '700',
  },
});

export default ReSubscribeScreen;
