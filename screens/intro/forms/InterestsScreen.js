import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import Colors from '../../../constants/Colors';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';

// Simple event bus for interest updates
const interestEventBus = {
  listeners: new Set(),
  emit(interest) {
    this.listeners.forEach(listener => listener(interest));
  },
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

const InterestsScreen = ({ navigation }) => {
  // Define all categories and their interests
  const categories = [
    {
      id: 'hobbies',
      label: 'Hobbies',
      interests: [
        'Reading', 'Writing', 'Design', 'Fishing', 'Shopping', 'Singing',
        'Painting', 'Cooking', 'Make-up', 'Healthy lifestyle', 'Blogging', 'Teaching',
        'Photography', 'Movies', 'Gardening', 'Poetry'
      ]
    },
    {
      id: 'sports',
      label: 'Sports',
      interests: [
        'Football', 'Basketball', 'Volleyball', 'Golf', 'Handball', 'Tennis',
        'Bodybuilding', 'Running', 'Swimming', 'Wrestling', 'Cycling',
        'Yoga', 'Gymnastics', 'Badminton', 'Boxing', 'Climbing', 'Hockey'
      ]
    },
    {
      id: 'pets',
      label: 'Pets',
      interests: [
        'Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Snake', 'Turtles', 'Fish', 'Parrot'
      ]
    },
    {
      id: 'music',
      label: 'Music',
      interests: [
        'Afrobeats', 'Hip-hop', 'Reggae', 'Folk music', 'Pop', 'Country',
        'Latin American music', 'Highlife', 'Gospel', 'R&B', 'Blues', 'Jazz', 'Disco'
      ]
    },
    {
      id: 'travel',
      label: 'Travel',
      interests: [
        'Abroad', 'Seas', 'Mountains', 'Nature', 'Hiking', 'Attractions', 'Cities', 'Domestic'
      ]
    },
    {
      id: 'foodAndDrink',
      label: 'Food and Drink',
      interests: [
        'Coffee', 'Tea', 'Beer', 'Wine', 'Vegan', 'Whiskey', 'Cocktails',
        'Pizza', 'Home food', 'Sweets', 'Fast food', 'Grill', 'Vegetarian', 'Sushi'
      ]
    },
    {
      id: 'goingOut',
      label: 'Going out',
      interests: [
        'Galleries', 'Restaurants', 'Cafes', 'Karaoke', 'Museums', 'Theatres',
        'Nightclubs', 'Concerts', 'Bars'
      ]
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState('hobbies');
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Add listener for removed interests
  React.useEffect(() => {
    const unsubscribe = interestEventBus.subscribe((removedInterest) => {
      setSelectedInterests(prev => prev.filter(i => i !== removedInterest));
    });
    return () => unsubscribe();
  }, []);

  // Add this useEffect to load saved interests when component mounts
  React.useEffect(() => {
    const loadSavedInterests = async () => {
      try {
        const savedInterests = await AsyncStorage.getItem('userInterests');
        if (savedInterests) {
          setSelectedInterests(JSON.parse(savedInterests));
        }
      } catch (error) {
        console.error('Error loading interests:', error);
      }
    };
    loadSavedInterests();
  }, []);

  const toggleInterest = async (interest) => {
    try {
      let newInterests;
      if (selectedInterests.includes(interest)) {
        newInterests = selectedInterests.filter(i => i !== interest);
        interestEventBus.emit(interest); // Emit when interest is removed
      } else {
        newInterests = [...selectedInterests, interest];
      }
      setSelectedInterests(newInterests);
      await AsyncStorage.setItem('userInterests', JSON.stringify(newInterests));
    } catch (error) {
      console.error('Error saving interest:', error);
    }
  };

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { interests: selectedInterests },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update interests response:', res.data);
      navigation.navigate('LifestyleChoices');
    } catch (error) {
      console.error('Error updating interests:', error);
      navigation.navigate('LifestyleChoices'); // Optionally still navigate
    }
  };

  const handleDisplayInterests = () => {
    navigation.navigate('DisplayInterests');
  };

  return (
    <OnboardingTemplate
      title="What are your interests?"
      subtitle="Select your interests to help us match you better. Explore all sections for more options."
      currentStep={4}
      totalSteps={8}
      onNext={handleNext}
      canProgress={selectedInterests.length > 0}
    >
      <View style={styles.contentContainer}>
        {/* View Selections Section */}
        {selectedInterests.length > 0 && (
          <View style={styles.viewSelectionsContainer}>
            <TouchableOpacity onPress={handleDisplayInterests}>
              <Text style={styles.viewSelectionsText}>View selections</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={handleDisplayInterests}
            >
              <View style={styles.innerCircle}>
                <Text style={styles.counterText}>{selectedInterests.length}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Navigation */}
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.selectedCategoryButtonText
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Interests Grid */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.interestsScrollContainer}
          style={styles.interestsScrollView}
        >
          <View style={styles.interestsContainer}>
            {categories.find(c => c.id === selectedCategory).interests
              .filter(interest => !selectedInterests.includes(interest)) // Filter out selected interests
              .map((interest, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.interestButton,
                    selectedInterests.includes(interest) && styles.selectedInterestButton
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.interestButtonText,
                    selectedInterests.includes(interest) && styles.selectedInterestButtonText
                  ]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </ScrollView>
      </View>
    </OnboardingTemplate>
  );
};

// Export the event bus to be used in DisplayInterestsScreen
export { interestEventBus };

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  viewSelectionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 15,
    float: 'right',
    justifyContent: 'flex-end',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 5,
  },
  categoryScrollContainer: {
    paddingRight: 10,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  innerCircle: {
    width: 24,
    height: 24,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  interestsScrollView: {
    flex: 1,
  },
  interestsScrollContainer: {
    paddingTop: 0, // Remove top padding to start immediately
    paddingBottom: 20,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 90,
    marginRight: 10,
    backgroundColor: '#240318',
    borderWidth: 1, 
    height: 35,
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.regular,
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 5,
  },
  interestButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 90,
    backgroundColor: '#222',
    marginRight: 10,
    marginBottom: 10, 
  },
  selectedInterestButton: {
    backgroundColor: Colors.primary,
  },
  interestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  selectedInterestButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
  },
  viewSelectionsText: {
    color: '#FFFFFF',
    opacity: 0.6,
    marginRight: 8,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});

export default InterestsScreen;