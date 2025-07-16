import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Animated } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GoalsScreen = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const scrollViewRef = useRef(null);
  const scrollAnimationValue = useRef(new Animated.Value(0)).current;
  const animationRunning = useRef(false);
  
  const goals = [
    { 
      id: 1, 
      label: "Find a Life Partner",
      subtitle: "Find your soulmate match",
      icon: require('../../../assets/ring.png')
    },
    { 
      id: 2, 
      label: "Find a Long-Term Partner",
      subtitle: "Build lasting, meaningful relationships",
      icon: require('../../../assets/heart.png')
    },
    { 
      id: 3, 
      label: "Find a Long-Term Connection",
      subtitle: "Explore slow burn relationships",
      icon: require('../../../assets/connect.png')
    },
    { 
      id: 4, 
      label: "Find a Short-Term Connection",
      subtitle: "Discover exciting adventures",
      icon: require('../../../assets/revolve.png')
    },
    { 
      id: 5, 
      label: "Build a Future Together",
      subtitle: "Share a future with the right person",
      icon: require('../../../assets/house.png')
    },
  ];

  // Run the animation after component mount and when the content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      runHintAnimation();
    }, 500); // Wait 1.5 seconds before starting animation
    
    return () => clearTimeout(timer);
  }, []);

  const runHintAnimation = () => {
    // Prevent multiple animations from running simultaneously
    if (animationRunning.current) return;
    
    animationRunning.current = true;
    
    // First, scroll down to reveal the last item
    Animated.timing(scrollAnimationValue, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        // After showing the last item, scroll back up
        setTimeout(() => {
          Animated.timing(scrollAnimationValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            animationRunning.current = false;
          });
        }, 1000); // Show the last item for 1 second
      }
    });
  };

  useEffect(() => {
    // Apply the animation value to the scroll position
    const scrollListener = scrollAnimationValue.addListener(({ value }) => {
      if (scrollViewRef.current) {
        // Calculate the max scroll position (adjust as needed based on your content)
        const maxScroll = 80; // This is an approximate value
        scrollViewRef.current.scrollTo({ y: value * maxScroll, animated: false });
      }
    });

    return () => {
      scrollAnimationValue.removeListener(scrollListener);
    };
  }, []);

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selected = goals.find(g => g.id === selectedGoal);
      if (!selected) {
        navigation.navigate('AboutYou');
        return;
      }
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { goal: selected.label },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update goal response:', res.data);
      navigation.navigate('AboutYou');
    } catch (error) {
      console.error('Error updating goal:', error);
      navigation.navigate('AboutYou'); // Optionally still navigate
    }
  };

  const renderGoalOption = (goal) => (
    <TouchableOpacity
      key={goal.id}
      style={[
        styles.goalOption,
        selectedGoal === goal.id && styles.selectedGoalOption
      ]}
      onPress={() => setSelectedGoal(goal.id)}
      activeOpacity={0.8}
    >
      <View style={styles.goalContent}>
        <Image source={goal.icon} style={styles.goalIcon} />
        <View style={styles.goalText}>
          <Text style={styles.goalLabel}>{goal.label}</Text>
          <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
        </View>
      </View>
      <View style={styles.radioButton}>
        <View style={[
          styles.radioCircle,
          selectedGoal === goal.id && styles.radioCircleSelected
        ]}>
          {selectedGoal === goal.id && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <OnboardingTemplate
      title="What's your goal?"
      subtitle="Select the goal that best describes what you're looking for on the platform."
      currentStep={4}
      totalSteps={15}
      onNext={handleNext}
      canProgress={selectedGoal !== null}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.goalsContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          // Reset animation when user takes control
          scrollAnimationValue.stopAnimation();
          animationRunning.current = false;
        }}
      >
        {goals.map(goal => renderGoalOption(goal))}
      </ScrollView>
    </OnboardingTemplate>
  );
};

const styles = StyleSheet.create({
  goalsContainer: { 
    marginBottom: 20,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12, 
  },
  selectedGoalOption: { 
  },
  goalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  goalText: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  radioButton: {
    padding: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#EC066A',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC066A',
  },
});

export default GoalsScreen;