import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AboutYouScreen = ({ navigation }) => {
  // Generate height options from 4'0" to 7'11"
  const generateHeightOptions = () => {
    const options = [];
    for (let feet = 4; feet <= 7; feet++) {
      for (let inches = 0; inches <= 11; inches++) {
        const heightInCm = Math.round((feet * 12 + inches) * 2.54);
        options.push({
          value: `${feet}'${inches}"`,
          label: `${feet}'${inches}" (${heightInCm} cm)`
        });
      }
    }
    return options;
  };

  const heightOptions = generateHeightOptions();
  const [selectedIndex, setSelectedIndex] = useState(20); // Default to around 5'6"
  const flatListRef = useRef(null);
  const itemHeight = 50; // Set to match the exact height in the screenshot

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedHeight = heightOptions[selectedIndex].label;
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { height: selectedHeight },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update height response:', res.data);
      navigation.navigate('Interests');
    } catch (error) {
      console.error('Error updating height:', error);
      navigation.navigate('Interests'); // Optionally still navigate
    }
  };

  // Initial scroll positioning
  useEffect(() => {
    if (flatListRef.current) {
      // Position the list so the selected item is in the middle
      flatListRef.current.scrollToIndex({
        index: selectedIndex,
        animated: false,
        viewPosition: 0.5 // This positions the selected item in the middle
      });
    }
  }, []);

  const renderItem = ({ item, index }) => {
    const isSelected = index === selectedIndex;
    const distance = Math.abs(index - selectedIndex);
    let opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.2;
    
    return (
      <TouchableOpacity
        style={styles.heightOption}
        onPress={() => {
          setSelectedIndex(index);
          flatListRef.current.scrollToIndex({
            index: index,
            animated: true,
            viewPosition: 0.5
          });
        }}
      >
        <Text
          style={{
            color: `rgba(255, 255, 255, ${opacity})`,
            fontSize: 20,
            fontFamily: FONTS.regular,
            fontWeight: isSelected ? '500' : '400',
          }}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Custom getItemLayout to ensure precise positioning
  const getItemLayout = (data, index) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });

  return (
    <OnboardingTemplate
      title="Now, let's talk about you."
      subtitle="Tell us about yourself to help us match you with someone special."
      currentStep={3}
      totalSteps={8}
      onNext={handleNext}
      canProgress={true}
    >
      <Text style={styles.questionText}>What is your height?</Text>
      
      <View style={styles.pickerContainer}>
        {/* This is the highlight that stays fixed in the middle */}
        <View style={styles.selectionHighlight} pointerEvents="none" />
        
        <FlatList
          ref={flatListRef}
          data={heightOptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.value}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          initialScrollIndex={selectedIndex}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<View style={styles.pickerPadding} />}
          ListFooterComponent={<View style={styles.pickerPadding} />}
          onMomentumScrollEnd={(event) => {
            // Calculate which item is now centered
            const offsetY = event.nativeEvent.contentOffset.y;
            const newIndex = Math.round(offsetY / itemHeight);
            
            if (newIndex >= 0 && newIndex < heightOptions.length) {
              setSelectedIndex(newIndex);
            }
          }}
        />
      </View>
    </OnboardingTemplate>
  );
};

const styles = StyleSheet.create({
  questionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  pickerContainer: {
    height: 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightOption: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  selectionHighlight: {
    position: 'absolute',
    height: 50,
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    top: 100, // Position in the middle (250/2 - 25)
    zIndex: -1,
  },
  listContent: { 
    paddingBottom: 50,
  },
  pickerPadding: {
    height: 100, // Ensure enough padding for proper scrolling
  }
});

export default AboutYouScreen;