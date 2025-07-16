import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const goals = [
  {
    id: 1,
    label: 'Find a Life Partner',
    subtitle: 'Find your marriage match.',
    icon: require('../../assets/ring.png'),
  },
  {
    id: 2,
    label: 'Find a Long-Term Partner',
    subtitle: 'Build a lasting, meaningful relationship.',
    icon: require('../../assets/heart.png'),
  },
  {
    id: 3,
    label: 'Find a Long-Term Connection',
    subtitle: 'Explore a serious relationship.',
    icon: require('../../assets/connect.png'),
  },
  {
    id: 4,
    label: 'Find a Short-Term Connection',
    subtitle: 'Meet new people and see where it leads.',
    icon: require('../../assets/revolve.png'),
  },
  {
    id: 5,
    label: 'Build a Future Together',
    subtitle: 'Share dreams with the right person.',
    icon: require('../../assets/house.png'),
  },
];

const RelationshipGoals = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="Relationship goals" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {goals.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.goalOption, selectedGoal === goal.id && styles.selectedGoalOption]}
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
              <View style={[styles.radioCircle, selectedGoal === goal.id && styles.radioCircleSelected]}>
                {selectedGoal === goal.id && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.doneButton, { opacity: selectedGoal === null ? 0.5 : 1 }]}
        disabled={selectedGoal === null}
        onPress={() => navigation && navigation.goBack()}
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
    paddingHorizontal: 12,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedGoalOption: {},
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
  doneButton: {
    backgroundColor: '#EC066A',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default RelationshipGoals;
