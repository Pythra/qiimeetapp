import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import { interestEventBus } from './InterestsScreen'; // Import the event bus

const DisplayInterestsScreen = ({ navigation }) => {
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    const loadInterests = async () => {
      try {
        const savedInterests = await AsyncStorage.getItem('userInterests');
        if (savedInterests) {
          setInterests(JSON.parse(savedInterests));
        }
      } catch (error) {
        console.error('Error loading interests:', error);
      }
    };
    loadInterests();
  }, []);

  const removeInterest = async (interestToRemove) => {
    try {
      const updatedInterests = interests.filter(interest => interest !== interestToRemove);
      setInterests(updatedInterests);
      await AsyncStorage.setItem('userInterests', JSON.stringify(updatedInterests));
      
      // Emit the removed interest through the event bus
      interestEventBus.emit(interestToRemove);
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interests</Text>
      </View>
       
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.interestsContainer}>
          {interests.map((interest, index) => (
            <View key={index} style={styles.interestItem}>
              <Text style={styles.interestText}>{interest}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeInterest(interest)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    verticalAlign: 'center',
  },
  backButton: {
    fontSize: 38,
    color: '#FFFFFF',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight:24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestItem: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  interestText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 8,
  },
  removeButton: {
    width: 24,
    height: 24, 
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center',
    verticalAlign: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 32, 
    lineHeight: 29,
    fontWeight: '300',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DisplayInterestsScreen;