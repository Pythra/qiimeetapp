import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import CustomButton from '../../constants/button';
import Slider from '@react-native-community/slider';
import VerifiedInfoModal from './VerifiedInfoModal';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Feather from 'react-native-vector-icons/Feather';

const BasicFilters = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [heightRange, setHeightRange] = useState([140, 220]);
  const [isAgeCustomized, setIsAgeCustomized] = useState(false);
  const [isHeightCustomized, setIsHeightCustomized] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showNearbyOptions, setShowNearbyOptions] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);
  const [showSimilarInterests, setShowSimilarInterests] = useState(false);

  const renderBasicTab = () => (
    <>
      <Text style={styles.sectionTitle}>Age Range</Text>
      <View style={[styles.section, styles.sliderSection]}>
        <View style={styles.sliderContainer}>
          <MultiSlider
            values={ageRange}
            min={18}
            max={75}
            step={1}
            onValuesChange={(values) => {
              setAgeRange(values);
              setIsAgeCustomized(true);
            }}
            selectedStyle={{ backgroundColor: '#ec066a' }}
            unselectedStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            sliderLength={280}
            markerStyle={styles.marker}
            containerStyle={styles.sliderInnerContainer}
          />
        </View>
        <Text style={styles.menuValue}>
          {isAgeCustomized 
            ? `Between ${ageRange[0]} to ${ageRange[1]}`
            : 'Between 18 and 75'}
        </Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Show nearby options when out</Text>
          <Switch
            value={showNearbyOptions}
            onValueChange={setShowNearbyOptions}
            trackColor={{ false: '#333', true: '#ec066a' }}
            thumbColor={showNearbyOptions ? '#000' : 'rgba(225, 225, 225, 0.5)'}
            style={styles.smallSwitch}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('LocationFilter')}
        > 
          <View style={styles.menuItemContent}>
            <Text style={styles.menuValue}>Nigeria</Text>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>What languages do they know?</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('LanguageFilter')}
        > 
          <View style={styles.menuItemContent}>
            <Text style={styles.menuValue}>Select languages</Text>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.verifiedTitleContainer}>
        <Text style={[styles.sectionTitle, styles.verifiedTitle]}>Have they verified themselves?</Text>
        <Text 
          style={styles.whatsThis}
          onPress={() => setShowVerifiedInfo(true)}
        >What's this?</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.verifiedSection}>
          <Text style={styles.menuValue}>Show verified profiles only</Text>
          <Switch
            value={isVerified}
            onValueChange={setIsVerified}
            trackColor={{ false: '#333', true: '#ec066a' }}
            thumbColor={isVerified ? '#000' : 'rgba(225, 225, 225, 0.5)'}
            style={styles.smallSwitch}
          />
        </View>
      </View>
    </>
  );

  const renderAdvancedTab = () => (
    <>
      <Text style={styles.sectionTitle}>How tall are they?</Text>
      <View style={[styles.section, styles.sliderSection]}>
        <Text style={styles.menuValue}>
          {isHeightCustomized 
            ? `Between ${heightRange[0]} to ${heightRange[1]} cm`
            : 'Any height is fine'}
        </Text>
        <View style={styles.sliderContainer}>
          <MultiSlider
            values={heightRange}
            min={140}
            max={220}
            step={1}
            onValuesChange={(values) => {
              setHeightRange(values);
              setIsHeightCustomized(true);
            }}
            selectedStyle={{ backgroundColor: '#ec066a' }}
            unselectedStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            sliderLength={280}
            markerStyle={styles.marker}
            containerStyle={styles.sliderInnerContainer}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Show me other people if I run out</Text>
          <Switch
            value={showOthers}
            onValueChange={setShowOthers}
            trackColor={{ false: '#333', true: '#ec066a' }}
            thumbColor={showOthers ? '#000' : 'rgba(225, 225, 225, 0.5)'}
            style={styles.smallSwitch}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Relationship type seeking</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('RelationshipType')}
        >
          <View style={styles.menuItemContent}>
            <View> 
              <Text style={styles.menuValue}>All</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>


      <Text style={styles.sectionTitle}>Match with similar interests?</Text>
      <View style={styles.section}>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuValue}>Show people with similar interests</Text>
          <Switch
            value={showSimilarInterests}
            onValueChange={setShowSimilarInterests}
            trackColor={{ false: '#333', true: '#ec066a' }}
            thumbColor={showSimilarInterests ? '#000' : 'rgba(225, 225, 225, 0.5)'}
            style={styles.smallSwitch}
          />
        </View>
      </View>

    <Text style={styles.sectionTitle}>What lifestyle choices matter to you?</Text>
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('LifestyleChoices')}
      >
        <View style={styles.menuItemContent}>
          <View> 
            <Text style={styles.menuValue}>Select lifestyle preferences</Text>
          </View>
          <Feather name="chevron-right" size={24} color="#666" />
        </View>
      </TouchableOpacity>
    </View>

      <Text style={styles.sectionTitle}>What's their education level?</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('EducationLevel')}
        >
          <View style={styles.menuItemContent}>
            <View> 
              <Text style={styles.menuValue}>Select education level</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      
      <Text style={styles.sectionTitle}>Do zodiac signs matter to you?</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ZodiacSign')}
        >
          <View style={styles.menuItemContent}>
            <View> 
              <Text style={styles.menuValue}>Select zodiac sign</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>What's their family plan?</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('FamilyPlan')}
        >
          <View style={styles.menuItemContent}>
            <View> 
              <Text style={styles.menuValue}>Select family preferences</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>What personality matters to you?</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('PersonalityFilter')}
        >
          <View style={styles.menuItemContent}>
            <View> 
              <Text style={styles.menuValue}>Select personality</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Does religion matter to you?</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReligionFilter')}
        >
          <View style={styles.menuItemContent}>
            <View> 
              <Text style={styles.menuValue}>Select religion</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <TopHeader title="Search filters" onBack={() => navigation.goBack()} />

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
            onPress={() => setActiveTab('basic')}
          >
            <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>Basic</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'advanced' && styles.activeTab]}
            onPress={() => setActiveTab('advanced')}
          >
            <Text style={[styles.tabText, activeTab === 'advanced' && styles.activeTabText]}>Advanced</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'basic' ? renderBasicTab() : renderAdvancedTab()}
      </ScrollView>

      <VerifiedInfoModal 
        visible={showVerifiedInfo} 
        onClose={() => setShowVerifiedInfo(false)} 
      />

      <View style={styles.footer}>
        <CustomButton title="Apply" 
        onPress={() => navigation.navigate('HomeScreen')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 32,
  },
  tabsContainer: { 
    paddingVertical: 8,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 50,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 90,
    backgroundColor: '#1e1e1e',
  },
  activeTab: {
    backgroundColor: '#ec066a',
  },
  tabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  verifiedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verifiedTitle: {
    marginBottom: 0,
    maxWidth: '70%',
    flex: 1,
  },
  whatsThis: {
    color: '#ec066a',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  sliderSection: {
    paddingHorizontal: 20,
  },
  ageValue: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  heightValue: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  sliderContainer: { 
    marginVertical: 20,
  },
  sliderInnerContainer: {
    alignItems: 'center',
    height: 10,
  },
  marker: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#ec066a',
    borderWidth: 0,
  },
  menuItem: {
    paddingVertical: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  menuValue: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16, 
    fontFamily: FONTS.regular,
    letterSpacing: 0,
  },
  verifiedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
  },
  switchText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    letterSpacing: 0,
    fontFamily: FONTS.regular,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  smallSwitch: {
    transform: [{ scaleX: 0.5 }, { scaleY: 0.5 }],
  },
});

export default BasicFilters;
