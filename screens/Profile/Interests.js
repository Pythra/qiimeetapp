import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

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

const Interests = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('hobbies');
  const [selectedInterests, setSelectedInterests] = useState([
    'Traveling', 'Dancing', 'Make-up', 'Swimming', 'Cat', 'Afrobeats',
    'Homefood', 'Restaurants', 'Instagram', 'Sleep', 'Tiktok'
  ]);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader title="Interests" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Interests */}
        <View style={styles.selectedInterestsContainer}>
          {selectedInterests.map((interest, idx) => (
            <View key={interest} style={styles.selectedInterestTag}>
              <Text style={styles.selectedInterestText}>{interest}</Text>
              <TouchableOpacity onPress={() => toggleInterest(interest)}>
                <Ionicons name="close" size={16} color="#fff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryTab, selectedCategory === category.id && styles.selectedCategoryTab]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[styles.categoryTabText, selectedCategory === category.id && styles.selectedCategoryTabText]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Interests Grid */}
        <View style={styles.interestsGrid}>
          {categories.find(c => c.id === selectedCategory).interests
            .filter(interest => !selectedInterests.includes(interest))
            .map((interest, idx) => (
              <TouchableOpacity
                key={interest}
                style={styles.interestTag}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={styles.interestTagText}>{interest}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.navigate('EditProfile', { interests: selectedInterests })}
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
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  selectedInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
    marginLeft: 2,
  },
  selectedInterestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC066A',
    borderRadius: 90,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedInterestText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginRight: 4,
  },
  categoryTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    paddingBottom: 16,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 90,
    backgroundColor: 'rgba(236, 6, 106, 0.5)',
    marginRight: 8,
  },
  selectedCategoryTab: {
    backgroundColor: '#EC066A',
  },
  categoryTabText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  selectedCategoryTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginLeft: 2,
  },
  interestTag: {
    backgroundColor: '#222',
    borderRadius: 90,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestTagText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  doneButton: {
    backgroundColor: '#EC066A',
    borderRadius: 90,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 56,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default Interests;
