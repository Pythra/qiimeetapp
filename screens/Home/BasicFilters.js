import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import CustomButton from '../../constants/button';
import Colors from '../../constants/Colors';
import Slider from '@react-native-community/slider';
import VerifiedInfoModal from './VerifiedInfoModal';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../components/AuthContext';
import { API_BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BasicFilters = ({ navigation, route }) => {
  const { user: currentUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [heightRange, setHeightRange] = useState([140, 220]);
  // Age slider always visible; remove customization toggle
  const [isHeightCustomized, setIsHeightCustomized] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showNearbyOptions, setShowNearbyOptions] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);
  const [showSimilarInterests, setShowSimilarInterests] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [location, setLocation] = useState('All');
  const [languages, setLanguages] = useState([]);
  const [relationshipType, setRelationshipType] = useState('All');
  const [lifestyleChoices, setLifestyleChoices] = useState([]);
  const [educationLevel, setEducationLevel] = useState('All');
  const [zodiacSign, setZodiacSign] = useState('All');
  const [familyPlan, setFamilyPlan] = useState('All');
  const [personality, setPersonality] = useState('All');
  const [religion, setReligion] = useState('All');

  // Load saved filter settings on component mount
  useEffect(() => {
    loadFilterSettings();
    
    // Add navigation listener to track navigation events
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      console.log('🧭 Navigation event: beforeRemove');
      console.log('📋 Current route params:', route?.params);
    });
    
    return unsubscribe;
  }, [navigation, route?.params]);

  const loadFilterSettings = async () => {
    try {
      // Load both filter settings and active filters
      const [savedFilters, activeFilters] = await Promise.all([
        AsyncStorage.getItem('filterSettings'),
        AsyncStorage.getItem('activeFilters')
      ]);
      
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        console.log('Loading saved filter settings:', filters);
        
        // Apply saved settings
        if (filters.ageRange) {
          setAgeRange(filters.ageRange);
        }
        if (filters.heightRange) {
          setHeightRange(filters.heightRange);
          setIsHeightCustomized(filters.isHeightCustomized || false);
        }
        if (filters.location) setLocation(filters.location);
        if (filters.languages) setLanguages(filters.languages);
        if (filters.isVerified !== undefined) setIsVerified(filters.isVerified);
        if (filters.showNearbyOptions !== undefined) setShowNearbyOptions(filters.showNearbyOptions);
        if (filters.showOthers !== undefined) setShowOthers(filters.showOthers);
        if (filters.showSimilarInterests !== undefined) setShowSimilarInterests(filters.showSimilarInterests);
        if (filters.relationshipType) setRelationshipType(filters.relationshipType);
        if (filters.lifestyleChoices) setLifestyleChoices(filters.lifestyleChoices);
        if (filters.educationLevel) setEducationLevel(filters.educationLevel);
        if (filters.zodiacSign) setZodiacSign(filters.zodiacSign);
        if (filters.familyPlan) setFamilyPlan(filters.familyPlan);
        if (filters.personality) setPersonality(filters.personality);
        if (filters.religion) setReligion(filters.religion);
        if (filters.activeTab) setActiveTab(filters.activeTab);
      }
      
      if (activeFilters) {
        const filters = JSON.parse(activeFilters);
        console.log('Loading active filters:', filters);
        
        // Apply active filter values
        if (filters.ageRange) {
          setAgeRange(filters.ageRange);
        }
        if (filters.heightRange) {
          setHeightRange(filters.heightRange);
          setIsHeightCustomized(true);
        }
        if (filters.location) setLocation(filters.location);
        if (filters.languages) setLanguages(filters.languages);
        if (filters.verifiedOnly !== undefined) setIsVerified(filters.verifiedOnly);
        if (filters.showNearbyOptions !== undefined) setShowNearbyOptions(filters.showNearbyOptions);
        if (filters.showOthers !== undefined) setShowOthers(filters.showOthers);
        if (filters.similarInterests !== undefined) setShowSimilarInterests(filters.similarInterests);
        if (filters.relationshipType) setRelationshipType(filters.relationshipType);
        if (filters.lifestyleChoices) setLifestyleChoices(filters.lifestyleChoices);
        if (filters.educationLevel) setEducationLevel(filters.educationLevel);
        if (filters.zodiacSign) setZodiacSign(filters.zodiacSign);
        if (filters.familyPlan) setFamilyPlan(filters.familyPlan);
        if (filters.personality) setPersonality(filters.personality);
        if (filters.religion) setReligion(filters.religion);
      }
    } catch (error) {
      console.error('Error loading filter settings:', error);
    }
  };

  const saveFilterSettings = async () => {
    try {
      const filterSettings = {
        ageRange,
        heightRange,
        isHeightCustomized,
        location,
        languages,
        isVerified,
        showNearbyOptions,
        showOthers,
        showSimilarInterests,
        relationshipType,
        lifestyleChoices,
        educationLevel,
        zodiacSign,
        familyPlan,
        personality,
        religion,
        activeTab
      };
      
      await AsyncStorage.setItem('filterSettings', JSON.stringify(filterSettings));
      console.log('Filter settings saved:', filterSettings);
    } catch (error) {
      console.error('Error saving filter settings:', error);
    }
  };

  const renderBasicTab = () => (
    <View>
      <View style={styles.section}>
        <View style={styles.verifiedTitleContainer}>
          <Text style={[styles.sectionTitle, styles.verifiedTitle]}>Age Range</Text>
        </View>
        <View style={styles.sliderSection}>
          <Text style={styles.ageValue}>
            {ageRange[0]} - {ageRange[1]} years
          </Text>
          <View style={styles.sliderContainer}>
            <MultiSlider
              values={ageRange}
              onValuesChange={setAgeRange}
              min={18}
              max={99}
              step={1}
              sliderLength={280}
              selectedStyle={{ backgroundColor: '#ec066a' }}
              unselectedStyle={{ backgroundColor: '#333' }}
              containerStyle={{ height: 40 }}
              trackStyle={{ height: 4, borderRadius: 2 }}
              markerStyle={{ height: 20, width: 20, borderRadius: 10, backgroundColor: '#ec066a' }}
              onValuesChangeFinish={(values) => {
                console.log('🎂 Age range changed to:', values);
                setAgeRange(values);
              }}
            />
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('LocationFilter')}
        > 
          <View style={styles.menuItemContent}>
            <Text style={styles.menuValue}>{location !== 'All' ? location : 'Nigeria'}</Text>
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
            <Text style={styles.menuValue}>
          {languages.length > 0 ? languages.join(', ') : 'Select languages'}
        </Text>
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
          <TouchableOpacity onPress={() => setIsVerified(!isVerified)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={isVerified ? 'toggle-switch' : 'toggle-switch-off-outline'}
              size={30}
              color={isVerified ? Colors.primaryDark : '#888'}
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
          <TouchableOpacity onPress={() => setShowOthers(!showOthers)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={showOthers ? 'toggle-switch' : 'toggle-switch-off-outline'}
              size={30}
              color={showOthers ? Colors.primaryDark : '#888'}
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
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
              <Text style={styles.menuValue}>{relationshipType !== 'All' ? relationshipType : 'All'}</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>


      <Text style={styles.sectionTitle}>Match with similar interests?</Text>
      <View style={styles.section}>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuValue}>Show people with similar interests</Text>
          <TouchableOpacity onPress={() => setShowSimilarInterests(!showSimilarInterests)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={showSimilarInterests ? 'toggle-switch' : 'toggle-switch-off-outline'}
              size={30}
              color={showSimilarInterests ? Colors.primaryDark : '#888'}
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
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
              <Text style={styles.menuValue}>
                {lifestyleChoices.length > 0 ? lifestyleChoices.join(', ') : 'Select lifestyle preferences'}
              </Text>
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
              <Text style={styles.menuValue}>{educationLevel !== 'All' ? educationLevel : 'Select education level'}</Text>
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
              <Text style={styles.menuValue}>{zodiacSign !== 'All' ? zodiacSign : 'Select zodiac sign'}</Text>
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
              <Text style={styles.menuValue}>{familyPlan !== 'All' ? familyPlan : 'Select family preferences'}</Text>
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
              <Text style={styles.menuValue}>{personality !== 'All' ? personality : 'Select personality'}</Text>
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
              <Text style={styles.menuValue}>{religion !== 'All' ? religion : 'Select religion'}</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  // Function to reset all filters
  const handleResetFilters = async () => {
    setAgeRange([18, 99]);
    setHeightRange([140, 220]);
    setIsHeightCustomized(false);
    setIsVerified(false);
    setShowNearbyOptions(false);
    setShowOthers(false);
    setShowSimilarInterests(false);
    setLocation('All');
    setLanguages([]);
    setRelationshipType('All');
    setLifestyleChoices([]);
    setEducationLevel('All');
    setZodiacSign('All');
    setFamilyPlan('All');
    setPersonality('All');
    setReligion('All');
    
    // Clear saved filter settings
    try {
      await AsyncStorage.removeItem('filterSettings');
      await AsyncStorage.removeItem('activeFilters');
      console.log('Filter settings cleared');
    } catch (error) {
      console.error('Error clearing filter settings:', error);
    }
  };

  // Function to apply filters and fetch filtered users
  const handleApplyFilters = async () => {
    setLoading(true);
    
    try {
      console.log('🎯 === APPLYING FILTERS START ===');
      console.log('👤 Current user ID:', currentUser._id);
      console.log('🔧 Filter settings:', {
        ageRange,
        heightRange: isHeightCustomized ? heightRange : 'Not customized',
        location: location !== 'All' ? location : 'All locations',
        languages: languages.length > 0 ? languages : 'No languages selected',
        verifiedOnly: isVerified,
        showNearbyOptions,
        showOthers,
        similarInterests: showSimilarInterests,
        relationshipType: relationshipType !== 'All' ? relationshipType : 'All types',
        lifestyleChoices: lifestyleChoices.length > 0 ? lifestyleChoices : 'No choices selected',
        educationLevel: educationLevel !== 'All' ? educationLevel : 'All levels',
        zodiacSign: zodiacSign !== 'All' ? zodiacSign : 'All signs',
        familyPlan: familyPlan !== 'All' ? familyPlan : 'All plans',
        personality: personality !== 'All' ? personality : 'All personalities',
        religion: religion !== 'All' ? religion : 'All religions'
      });
      
      // Save filter settings before applying
      await saveFilterSettings();
      
      // Also save to AsyncStorage for persistence
      const filterSettings = {
        ageRange,
        heightRange: isHeightCustomized ? heightRange : null,
        location: location !== 'All' ? location : null,
        languages: languages.length > 0 ? languages : null,
        verifiedOnly: isVerified,
        showNearbyOptions,
        showOthers,
        similarInterests: showSimilarInterests,
        relationshipType: relationshipType !== 'All' ? relationshipType : null,
        lifestyleChoices: lifestyleChoices.length > 0 ? lifestyleChoices : null,
        educationLevel: educationLevel !== 'All' ? educationLevel : null,
        zodiacSign: zodiacSign !== 'All' ? zodiacSign : null,
        familyPlan: familyPlan !== 'All' ? familyPlan : null,
        personality: personality !== 'All' ? personality : null,
        religion: religion !== 'All' ? religion : null
      };
      
      await AsyncStorage.setItem('activeFilters', JSON.stringify(filterSettings));
      
      const filterData = {
        userId: currentUser._id,
        ageRange,
        heightRange: isHeightCustomized ? heightRange : null,
        location: location !== 'All' ? location : null,
        languages: languages.length > 0 ? languages : null,
        verifiedOnly: isVerified,
        showNearbyOptions,
        showOthers,
        similarInterests: showSimilarInterests,
        relationshipType: relationshipType !== 'All' ? relationshipType : null,
        lifestyleChoices: lifestyleChoices.length > 0 ? lifestyleChoices : null,
        educationLevel: educationLevel !== 'All' ? educationLevel : null,
        zodiacSign: zodiacSign !== 'All' ? zodiacSign : null,
        familyPlan: familyPlan !== 'All' ? familyPlan : null,
        personality: personality !== 'All' ? personality : null,
        religion: religion !== 'All' ? religion : null
      };

      console.log('📤 Sending filter data to backend:', filterData);
      console.log('🌐 API endpoint:', `${API_BASE_URL}/admin/users/home/filtered`);

      const response = await fetch(`${API_BASE_URL}/admin/users/home/filtered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filterData)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📥 Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📥 Parsed response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        console.log('✅ Filtered users received:', data.users?.length || 0, 'users');
        
        if (data.users && data.users.length > 0) {
          console.log('📋 First few filtered users:');
          data.users.slice(0, 3).forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || user.username} - Age: ${user.age}, Location: ${user.location}`);
          });
        }
        
        // Store filtered users in navigation params to pass to Home screen
        console.log('🧭 Navigating to HomeScreen with filtered data');
        navigation.navigate('HomeScreen', {
          filteredUsers: data.users || [],
          filtersApplied: true,
          filters: {
            ageRange,
            heightRange: isHeightCustomized ? heightRange : null,
            location: location !== 'All' ? location : null,
            languages: languages.length > 0 ? languages : null,
            verifiedOnly: isVerified,
            showNearbyOptions,
            showOthers,
            similarInterests: showSimilarInterests,
            relationshipType: relationshipType !== 'All' ? relationshipType : null,
            lifestyleChoices: lifestyleChoices.length > 0 ? lifestyleChoices : null,
            educationLevel: educationLevel !== 'All' ? educationLevel : null,
            zodiacSign: zodiacSign !== 'All' ? zodiacSign : null,
            familyPlan: familyPlan !== 'All' ? familyPlan : null,
            personality: personality !== 'All' ? personality : null,
            religion: religion !== 'All' ? religion : null
          }
        });
        
        console.log('✅ Navigation completed successfully');
      } else {
        console.error('❌ Filter application failed:', data.error);
        Alert.alert('Error', data.error || 'Failed to apply filters');
      }
      
      console.log('🎯 === APPLYING FILTERS END ===');
    } catch (error) {
      console.error('❌ Error applying filters:', error);
      Alert.alert('Error', 'Failed to apply filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Active filters indicator removed */}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'basic' ? renderBasicTab() : renderAdvancedTab()}
      </ScrollView>

      <VerifiedInfoModal 
        visible={showVerifiedInfo} 
        onClose={() => setShowVerifiedInfo(false)} 
      />

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <CustomButton 
            title={loading ? "Applying..." : "Apply"} 
            onPress={handleApplyFilters}
            disabled={loading}
            style={styles.applyButton}
          />
        </View>
        <TouchableOpacity 
          style={styles.resetTextContainer}
          onPress={handleResetFilters}
        >
          <Text style={styles.resetText}>Reset Filters</Text>
        </TouchableOpacity>
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
   buttonRow: {
     width: '100%',
   },
  applyButton: {
    width: '100%',
  },
  smallSwitch: {
    transform: [{ scaleX: 0.5 }, { scaleY: 0.5 }],
  },
  resetTextContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resetText: {
    color: '#ec066a',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  activeFiltersIndicator: {
    backgroundColor: '#ec066a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 8,
  },
  activeFiltersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default BasicFilters;
