import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import Slider from '@react-native-community/slider';

const AdvancedFilters = ({ navigation }) => {
  const [showOthers, setShowOthers] = useState(false);
  const [heightValue, setHeightValue] = useState(150); // Starting height in cm

  return (
    <View style={styles.container}>
      <TopHeader title="Search filters" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.tabText}>Basic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Advanced</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How tall are they?</Text>
          <Text style={styles.heightValue}>{heightValue} cm</Text>
          <Slider
            style={styles.slider}
            minimumValue={140}
            maximumValue={220}
            value={heightValue}
            onValueChange={value => setHeightValue(Math.round(value))}
            minimumTrackTintColor="#ec066a"
            maximumTrackTintColor="#333"
            thumbTintColor="#ec066a"
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Show me other people if I run out</Text>
            <Switch
              value={showOthers}
              onValueChange={setShowOthers}
              trackColor={{ false: '#333', true: '#ec066a' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('RelationshipType')}
        >
          <Text style={styles.menuText}>Relationship type seeking</Text>
          <Text style={styles.menuValue}>All</Text>
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Match with similar interests?</Text>
          <Switch
            trackColor={{ false: '#333', true: '#ec066a' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('LifestyleChoices')}
        >
          <Text style={styles.menuText}>What lifestyle choices matter to you?</Text>
          <Text style={styles.menuValue}>Select lifestyle preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('EducationLevel')}
        >
          <Text style={styles.menuText}>What's their education level?</Text>
          <Text style={styles.menuValue}>Select education level</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ZodiacSign')}
        >
          <Text style={styles.menuText}>Do zodiac signs matter to you?</Text>
          <Text style={styles.menuValue}>Select zodiac sign</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('FamilyPlan')}
        >
          <Text style={styles.menuText}>What's their family plan?</Text>
          <Text style={styles.menuValue}>Select family preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('PersonalityFilter')}
        >
          <Text style={styles.menuText}>What personality matters to you?</Text>
          <Text style={styles.menuValue}>Select personality</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReligionFilter')}
        >
          <Text style={styles.menuText}>Does religion matter to you?</Text>
          <Text style={styles.menuValue}>Select religion</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ec066a',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  activeTabText: {
    color: '#ec066a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  heightValue: {
    color: '#ec066a',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  menuValue: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  switchText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  applyButton: {
    backgroundColor: '#333',
    margin: 20,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});

export default AdvancedFilters;
