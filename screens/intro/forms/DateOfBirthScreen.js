import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 50;

const DateOfBirthScreen = ({ navigation }) => {
  const [selectedDay, setSelectedDay] = useState(31);
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [selectedYear, setSelectedYear] = useState(2007);

  const dayFlatListRef = useRef(null);
  const monthFlatListRef = useRef(null);
  const yearFlatListRef = useRef(null);

  // Generate arrays for the picker
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 2007 - 1950 + 1 }, (_, i) => 2007 - i).reverse();

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
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
      navigation.navigate('Goals');
    }
  };

  const formatNumber = (num) => num.toString().padStart(2, '0');

  const renderPickerColumn = (data, selectedValue, onValueChange, flatListRef, formatter = (val) => val) => {
    const getItemLayout = (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    });

    const handleScrollEnd = (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.max(0, Math.min(Math.round(y / ITEM_HEIGHT), data.length - 1));
      const newValue = data[index];
      
      if (newValue && newValue !== selectedValue) {
        onValueChange(newValue);
      }
    };

    const renderItem = ({ item, index }) => {
      const selectedIndex = data.indexOf(selectedValue);
      const isSelected = item === selectedValue;
      const isAdjacent = Math.abs(index - selectedIndex) === 1;
      
      const handleTap = () => {
        onValueChange(item);
        // Scroll to the tapped item
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }
      };
      
      return (
        <TouchableOpacity 
          style={styles.pickerItem}
          onPress={handleTap}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pickerText,
              isSelected && styles.pickerTextSelected,
              isAdjacent && styles.pickerTextAdjacent
            ]}
          >
            {formatter(item)}
          </Text>
        </TouchableOpacity>
      );
    };

    React.useEffect(() => {
      // Initial scroll to selected value
      setTimeout(() => {
        const index = data.indexOf(selectedValue);
        if (index !== -1 && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index,
            animated: false,
            viewPosition: 0.5,
          });
        }
      }, 100);
    }, []);

    return (
      <View style={styles.pickerColumn}>
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate={0.95}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
          // Better control props
          bounces={false}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          scrollEnabled={true}
          disableIntervalMomentum={false}
        />
        
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
            dayFlatListRef,
            formatNumber
          )}
          
          {/* Month Picker */}
          {renderPickerColumn(
            months,
            selectedMonth,
            setSelectedMonth,
            monthFlatListRef,
            formatNumber
          )}
          
          {/* Year Picker */}
          {renderPickerColumn(
            years,
            selectedYear,
            setSelectedYear,
            yearFlatListRef
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
    maxWidth: '33%',
    minWidth: 60,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
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
    paddingHorizontal: 8,
    height: ITEM_HEIGHT,
    textAlignVertical: 'center',
    textAlign: 'center',
    lineHeight: ITEM_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    minWidth: 60,
  },
  pickerTextAdjacent: {
    color: 'rgba(255, 255, 255, 0.6)',
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