import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 50;

const DateOfBirthScreen = ({ navigation }) => {
  const [selectedDay, setSelectedDay] = useState(31); // Default to last day
  const [selectedMonth, setSelectedMonth] = useState(12); // Default to last month
  const [selectedYear, setSelectedYear] = useState(2007); // Default to earliest year

  const dayScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  // Generate arrays for the picker
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  // Generate years from 2007 down to 1950 (reversed order for upward scrolling)
  const years = Array.from({ length: 2007 - 1950 + 1 }, (_, i) => 2007 - i).reverse();

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Format date as YYYY-MM-DD
      const dob = `${selectedYear}-${formatNumber(selectedMonth)}-${formatNumber(selectedDay)}`;
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { dateOfBirth: dob },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update dateOfBirth response:', res.data);
      navigation.navigate('Goals');
    } catch (error) {
      console.error('Error updating dateOfBirth:', error);
      navigation.navigate('Goals'); // Optionally still navigate
    }
  };

  const formatNumber = (num) => num.toString().padStart(2, '0');

  const renderPickerColumn = (data, selectedValue, onValueChange, scrollRef, formatter = (val) => val) => {
    const handleScroll = (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const newValue = data[index];
      if (newValue && newValue !== selectedValue) {
        onValueChange(newValue);
      }
    };

    const scrollToValue = (value) => {
      const index = data.indexOf(value);
      if (index !== -1 && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
      }
    };

    React.useEffect(() => {
      // Initial scroll to selected value - scroll to bottom positions for all pickers
      setTimeout(() => {
        const index = data.indexOf(selectedValue);
        if (index !== -1 && scrollRef.current) {
          scrollRef.current.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false, // No animation for initial positioning
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
                  {formatter(item)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        
        {/* Selection indicator lines */}
        <View style={styles.selectionIndicator} pointerEvents="none">
          <View style={styles.selectionLine} />
          <View style={[styles.selectionLine, { bottom: 0 }]} />
        </View>
      </View>
    );
  };

  return (
    <OnboardingTemplate
      title="What's your date of birth?"
      subtitle="Enter your date of birth to help us match you with people of similar age and interests"
      currentStep={3}
      totalSteps={15}
      onNext={handleNext}
      canProgress={true}
    >
      <View style={styles.datePickerContainer}>
        <View style={styles.pickerRow}>
          {/* Day Picker */}
          {renderPickerColumn(
            days,
            selectedDay,
            setSelectedDay,
            dayScrollRef,
            formatNumber
          )}
          
          {/* Month Picker */}
          {renderPickerColumn(
            months,
            selectedMonth,
            setSelectedMonth,
            monthScrollRef,
            formatNumber
          )}
          
          {/* Year Picker */}
          {renderPickerColumn(
            years,
            selectedYear,
            setSelectedYear,
            yearScrollRef
          )}
        </View>
        
      </View>
    </OnboardingTemplate>
  );
};

const styles = StyleSheet.create({
  datePickerContainer: { 
    alignItems: 'center',
    marginTop: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 250,
    width: width * 0.7,
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
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: 24,
    fontFamily: FONTS.regular,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    height: ITEM_HEIGHT, // Match the item height
    textAlignVertical: 'center', // Center text vertically
    textAlign: 'center', // Center text horizontally
    lineHeight: ITEM_HEIGHT, // Match height for vertical centering
    borderRadius: 8,
    overflow: 'hidden', 
  },
  pickerTextAdjacent: {
    color: 'rgba(255, 255, 255, 0.6)', // White with 50% opacity
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
});

export default DateOfBirthScreen;