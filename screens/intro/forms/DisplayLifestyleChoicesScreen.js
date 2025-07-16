import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import { FONTS } from '../../../constants/font';
import { lifestyleEventBus } from './LifestyleChoicesScreen';

const DisplayLifestyleChoicesScreen = ({ navigation }) => {
  const [choices, setChoices] = useState([]);

  useEffect(() => {
    const loadChoices = async () => {
      try {
        const savedChoices = await AsyncStorage.getItem('userLifestyleChoices');
        if (savedChoices) {
          setChoices(JSON.parse(savedChoices));
        }
      } catch (error) {
        console.error('Error loading choices:', error);
      }
    };
    loadChoices();
  }, []);

  const removeChoice = async (choiceToRemove) => {
    try {
      const updatedChoices = choices.filter(choice => choice !== choiceToRemove);
      setChoices(updatedChoices);
      await AsyncStorage.setItem('userLifestyleChoices', JSON.stringify(updatedChoices));
      lifestyleEventBus.emit(choiceToRemove); // Emit the removed choice
    } catch (error) {
      console.error('Error removing choice:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lifestyle Choices</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.choicesContainer}>
          {choices.map((choice, index) => (
            <View key={index} style={styles.choiceItem}>
              <Text style={styles.choiceText}>{choice}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeChoice(choice)}
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
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: FONTS.regular,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  choiceItem: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  choiceText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 8,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.regular,
  },
});

export default DisplayLifestyleChoicesScreen;