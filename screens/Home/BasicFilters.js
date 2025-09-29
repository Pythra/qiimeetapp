import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  
  // Debug effect to track languages state changes
  useEffect(() => {
    console.log('Languages state changed:', languages);
  }, [languages]);
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
    loadPreferencesFromDatabase();
    
    // VERIFICATION FILTER COMPLETELY REMOVED - NO ACTION NEEDED
    
    // Add navigation listener to track navigation events
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      console.log('Navigation event: beforeRemove');
    });
    
    return unsubscribe;
  }, [navigation, route?.params]);

  // Ensure filter state variables are never undefined
  useEffect(() => {
    if (!relationshipType || relationshipType === '') {
      setRelationshipType('All');
    }
    if (!zodiacSign || zodiacSign === '') {
      setZodiacSign('All');
    }
    if (!personality || personality === '') {
      setPersonality('All');
    }
    if (!educationLevel || educationLevel === '') {
      setEducationLevel('All');
    }
    if (!familyPlan || familyPlan === '') {
      setFamilyPlan('All');
    }
    if (!religion || religion === '') {
      setReligion('All');
    }
    if (!location || location === '') {
      setLocation('All');
    }
  }, [relationshipType, zodiacSign, personality, educationLevel, familyPlan, religion, location]);

  // Function to sync all language storage
  const syncLanguageStorage = async (newLanguages) => {
    try {
      // Update both AsyncStorage locations
      await saveFilterSettingsWithLanguages(newLanguages);
      
      // Also update the database
      await savePreferencesToDatabase(true, newLanguages);
      
      console.log('All language storage synchronized:', newLanguages);
    } catch (error) {
      console.error('Error syncing language storage:', error);
    }
  };

  // Listen for navigation focus to update filters when returning from filter screens
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 [DEBUG] useFocusEffect triggered');
      console.log('🔍 [DEBUG] Route params:', route?.params);
      
      // Check if we have route params with updated languages
      if (route?.params?.selectedLanguages) {
        const newLanguages = route.params.selectedLanguages;
        console.log('🔍 [DEBUG] Setting new languages from useFocusEffect:', {
          newLanguages: newLanguages,
          currentLanguages: languages,
          willChange: JSON.stringify(newLanguages) !== JSON.stringify(languages)
        });
        setLanguages(newLanguages);
        // Clear the route params to prevent re-application
        navigation.setParams({ selectedLanguages: undefined });
        // Sync all language storage locations
        syncLanguageStorage(newLanguages);
      }
      
      // Check if we have route params with updated relationship types
      if (route?.params?.selectedRelationshipTypes) {
        const newRelationshipTypes = route.params.selectedRelationshipTypes;
        console.log('🔍 [DEBUG] Setting new relationship types from useFocusEffect:', newRelationshipTypes);
        setRelationshipType(newRelationshipTypes.length > 0 ? newRelationshipTypes.join(', ') : 'All');
        // Clear the route params to prevent re-application
        navigation.setParams({ selectedRelationshipTypes: undefined });
        // Save to database immediately
        savePreferencesToDatabase(true);
      }
      
      // Check if we have route params with updated lifestyle choices
      if (route?.params?.selectedLifestyleChoices) {
        const newLifestyleChoices = route.params.selectedLifestyleChoices;
        console.log('🔍 [DEBUG] Setting new lifestyle choices from useFocusEffect:', newLifestyleChoices);
        setLifestyleChoices(newLifestyleChoices);
        // Clear the route params to prevent re-application
        navigation.setParams({ selectedLifestyleChoices: undefined });
        // Save to database immediately
        savePreferencesToDatabase(true);
      }
      
      // Check if we have route params with updated zodiac signs
      if (route?.params?.selectedZodiacSigns) {
        const newZodiacSigns = route.params.selectedZodiacSigns;
        console.log('🔍 [DEBUG] Setting new zodiac signs from useFocusEffect:', newZodiacSigns);
        setZodiacSign(newZodiacSigns.length > 0 ? newZodiacSigns.join(', ') : 'All');
        // Clear the route params to prevent re-application
        navigation.setParams({ selectedZodiacSigns: undefined });
        // Save to database immediately
        savePreferencesToDatabase(true);
      }
      
      // Check if we have route params with updated personality traits
      if (route?.params?.selectedPersonality) {
        const newPersonality = route.params.selectedPersonality;
        console.log('🔍 [DEBUG] Setting new personality traits from useFocusEffect:', newPersonality);
        setPersonality(newPersonality.length > 0 ? newPersonality.join(', ') : 'All');
        // Clear the route params to prevent re-application
        navigation.setParams({ selectedPersonality: undefined });
        // Save to database immediately
        savePreferencesToDatabase(true);
      }
    }, [route?.params, navigation, languages])
  );

  // Additional useEffect to handle route params changes
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect for route params triggered');
    console.log('🔍 [DEBUG] route?.params?.selectedLanguages:', route?.params?.selectedLanguages);
    
    if (route?.params?.selectedLanguages) {
      const newLanguages = route.params.selectedLanguages;
      console.log('🔍 [DEBUG] Setting new languages from useEffect:', {
        newLanguages: newLanguages,
        newLanguagesLength: newLanguages.length,
        newLanguagesType: typeof newLanguages
      });
      setLanguages(newLanguages);
      // Clear the route params to prevent re-application
      navigation.setParams({ selectedLanguages: undefined });
      // Sync all language storage locations
      syncLanguageStorage(newLanguages);
    }
  }, [route?.params?.selectedLanguages]);

  // Handle relationship type updates
  useEffect(() => {
    if (route?.params?.selectedRelationshipTypes) {
      const newRelationshipTypes = route.params.selectedRelationshipTypes;
      console.log('🔍 [DEBUG] Setting new relationship types from useEffect:', newRelationshipTypes);
      setRelationshipType(newRelationshipTypes.length > 0 ? newRelationshipTypes.join(', ') : 'All');
      // Clear the route params to prevent re-application
      navigation.setParams({ selectedRelationshipTypes: undefined });
      // Save to database immediately
      savePreferencesToDatabase(true);
    }
  }, [route?.params?.selectedRelationshipTypes, navigation]);

  // Handle lifestyle choices updates
  useEffect(() => {
    if (route?.params?.selectedLifestyleChoices) {
      const newLifestyleChoices = route.params.selectedLifestyleChoices;
      console.log('🔍 [DEBUG] Setting new lifestyle choices from useEffect:', newLifestyleChoices);
      setLifestyleChoices(newLifestyleChoices);
      // Clear the route params to prevent re-application
      navigation.setParams({ selectedLifestyleChoices: undefined });
      // Save to database immediately
      savePreferencesToDatabase(true);
    }
  }, [route?.params?.selectedLifestyleChoices, navigation]);

  // Handle zodiac signs updates
  useEffect(() => {
    if (route?.params?.selectedZodiacSigns) {
      const newZodiacSigns = route.params.selectedZodiacSigns;
      console.log('🔍 [DEBUG] Setting new zodiac signs from useEffect:', newZodiacSigns);
      setZodiacSign(newZodiacSigns.length > 0 ? newZodiacSigns.join(', ') : 'All');
      // Clear the route params to prevent re-application
      navigation.setParams({ selectedZodiacSigns: undefined });
      // Save to database immediately
      savePreferencesToDatabase(true);
    }
  }, [route?.params?.selectedZodiacSigns, navigation]);

  // Handle personality updates
  useEffect(() => {
    if (route?.params?.selectedPersonality) {
      const newPersonality = route.params.selectedPersonality;
      console.log('🔍 [DEBUG] Setting new personality traits from useEffect:', newPersonality);
      setPersonality(newPersonality.length > 0 ? newPersonality.join(', ') : 'All');
      // Clear the route params to prevent re-application
      navigation.setParams({ selectedPersonality: undefined });
      // Save to database immediately
      savePreferencesToDatabase(true);
    }
  }, [route?.params?.selectedPersonality, navigation]);

  const loadFilterSettings = async () => {
    try {
      // Load both filter settings and active filters
      const [savedFilters, activeFilters] = await Promise.all([
        AsyncStorage.getItem('filterSettings'),
        AsyncStorage.getItem('activeFilters')
      ]);
      
      // Priority: savedFilters > activeFilters > database
      let languagesToUse = null;
      
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
        if (filters.languages && filters.languages.length > 0) {
          console.log('🔍 [DEBUG] Loading languages from saved filters:', filters.languages);
          languagesToUse = filters.languages;
          setLanguages(filters.languages);
        } else if (languages.length === 0) {
          // Default to English if no languages are selected
          console.log('🔍 [DEBUG] No languages in saved filters, defaulting to English');
          setLanguages(['English']);
        }
        if (filters.isVerified !== undefined) {
          console.log('🔍 [DEBUG] Loading verification filter setting:', filters.isVerified);
          setIsVerified(filters.isVerified);
        } else {
          console.log('🔍 [DEBUG] No verification filter setting found, defaulting to false');
          setIsVerified(false);
        }
        if (filters.showNearbyOptions !== undefined) setShowNearbyOptions(filters.showNearbyOptions);
        if (filters.showOthers !== undefined) setShowOthers(filters.showOthers);
        if (filters.showSimilarInterests !== undefined) setShowSimilarInterests(filters.showSimilarInterests);
        if (filters.relationshipType) {
          const relationshipTypeValue = Array.isArray(filters.relationshipType) && filters.relationshipType.length > 0 
            ? filters.relationshipType.join(', ') 
            : filters.relationshipType;
          setRelationshipType(relationshipTypeValue);
        }
        if (filters.lifestyleChoices) setLifestyleChoices(filters.lifestyleChoices);
        if (filters.educationLevel) setEducationLevel(filters.educationLevel);
        if (filters.zodiacSign) {
          const zodiacSignValue = Array.isArray(filters.zodiacSign) && filters.zodiacSign.length > 0 
            ? filters.zodiacSign.join(', ') 
            : filters.zodiacSign;
          setZodiacSign(zodiacSignValue);
        }
        if (filters.familyPlan) setFamilyPlan(filters.familyPlan);
        if (filters.personality) {
          const personalityValue = Array.isArray(filters.personality) && filters.personality.length > 0 
            ? filters.personality.join(', ') 
            : filters.personality;
          setPersonality(personalityValue);
        }
        if (filters.religion) setReligion(filters.religion);
        if (filters.activeTab) setActiveTab(filters.activeTab);
      }
      
      // Only apply activeFilters if we don't have languages from savedFilters
      if (activeFilters && !languagesToUse) {
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
        if (filters.languages && filters.languages.length > 0) {
          console.log('🔍 [DEBUG] Loading languages from active filters:', filters.languages);
          setLanguages(filters.languages);
        } else if (languages.length === 0) {
          // Default to English if no languages are selected
          console.log('🔍 [DEBUG] No languages in active filters, defaulting to English');
          setLanguages(['English']);
        }
        if (filters.verifiedOnly !== undefined) setIsVerified(filters.verifiedOnly);
        if (filters.showNearbyOptions !== undefined) setShowNearbyOptions(filters.showNearbyOptions);
        if (filters.showOthers !== undefined) setShowOthers(filters.showOthers);
        if (filters.similarInterests !== undefined) setShowSimilarInterests(filters.similarInterests);
        if (filters.relationshipType) {
          const relationshipTypeValue = Array.isArray(filters.relationshipType) && filters.relationshipType.length > 0 
            ? filters.relationshipType.join(', ') 
            : 'All';
          setRelationshipType(relationshipTypeValue);
        }
        if (filters.lifestyleChoices) setLifestyleChoices(filters.lifestyleChoices);
        if (filters.educationLevel) setEducationLevel(filters.educationLevel);
        if (filters.zodiacSign) {
          const zodiacSignValue = Array.isArray(filters.zodiacSign) && filters.zodiacSign.length > 0 
            ? filters.zodiacSign.join(', ') 
            : 'All';
          setZodiacSign(zodiacSignValue);
        }
        if (filters.familyPlan) setFamilyPlan(filters.familyPlan);
        if (filters.personality) {
          const personalityValue = Array.isArray(filters.personality) && filters.personality.length > 0 
            ? filters.personality.join(', ') 
            : 'All';
          setPersonality(personalityValue);
        }
        if (filters.religion) setReligion(filters.religion);
      }
    } catch (error) {
      console.error('Error loading filter settings:', error);
    }
  };

  const saveFilterSettings = async () => {
    try {
      // Debug: Log the current state of filter variables
      console.log('🔍 [DEBUG] saveFilterSettings - Current filter states:', {
        relationshipType: relationshipType,
        zodiacSign: zodiacSign,
        personality: personality,
        relationshipTypeType: typeof relationshipType,
        zodiacSignType: typeof zodiacSign,
        personalityType: typeof personality
      });
      
      // Convert string-based filters back to arrays for proper storage
      const relationshipTypeArray = relationshipType && relationshipType !== 'All' && typeof relationshipType === 'string' ? relationshipType.split(', ') : [];
      const zodiacSignArray = zodiacSign && zodiacSign !== 'All' && typeof zodiacSign === 'string' ? zodiacSign.split(', ') : [];
      const personalityArray = personality && personality !== 'All' && typeof personality === 'string' ? personality.split(', ') : [];
      
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
        relationshipType: relationshipTypeArray,
        lifestyleChoices,
        educationLevel,
        zodiacSign: zodiacSignArray,
        familyPlan,
        personality: personalityArray,
        religion,
        activeTab
      };
      
      console.log('🔍 [DEBUG] saveFilterSettings called with languages:', languages);
      console.log('🔍 [DEBUG] Converting filters for storage:', {
        relationshipType: relationshipType,
        relationshipTypeArray: relationshipTypeArray,
        zodiacSign: zodiacSign,
        zodiacSignArray: zodiacSignArray,
        personality: personality,
        personalityArray: personalityArray
      });
      await AsyncStorage.setItem('filterSettings', JSON.stringify(filterSettings));
      console.log('Filter settings saved:', filterSettings);
    } catch (error) {
      console.error('Error saving filter settings:', error);
    }
  };

  const saveFilterSettingsWithLanguages = async (newLanguages) => {
    try {
      const filterSettings = {
        ageRange,
        heightRange,
        isHeightCustomized,
        location,
        languages: newLanguages, // Use the passed languages instead of state
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
      
      // Also update activeFilters to keep them in sync
      const activeFilters = {
        ageRange,
        heightRange: isHeightCustomized ? heightRange : null,
        location: location !== 'All' ? location : null,
        languages: newLanguages, // Sync this too
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
      
      console.log('🔍 [DEBUG] saveFilterSettingsWithLanguages called with languages:', newLanguages);
      await AsyncStorage.setItem('filterSettings', JSON.stringify(filterSettings));
      await AsyncStorage.setItem('activeFilters', JSON.stringify(activeFilters));
      console.log('Filter settings and active filters saved with languages:', newLanguages);
    } catch (error) {
      console.error('Error saving filter settings with languages:', error);
    }
  };

  // Save preferences to database with retry logic
  const savePreferencesToDatabase = async (filtersActive = true, languagesToSave = null, retryCount = 0) => {
    if (!currentUser?._id || !token) {
      console.log('❌ [DEBUG] Missing user ID or token for saving preferences');
      return;
    }
    
    const maxRetries = 2;
    
    try {
      // Debug: Log the current state of filter variables
      console.log('🔍 [DEBUG] savePreferencesToDatabase - Current filter states:', {
        relationshipType: relationshipType,
        zodiacSign: zodiacSign,
        personality: personality,
        relationshipTypeType: typeof relationshipType,
        zodiacSignType: typeof zodiacSign,
        personalityType: typeof personality
      });
      
      // Convert string-based filters back to arrays for database storage
      const relationshipTypeArray = relationshipType && relationshipType !== 'All' && typeof relationshipType === 'string' ? relationshipType.split(', ') : [];
      const zodiacSignArray = zodiacSign && zodiacSign !== 'All' && typeof zodiacSign === 'string' ? zodiacSign.split(', ') : [];
      const personalityArray = personality && personality !== 'All' && typeof personality === 'string' ? personality.split(', ') : [];
      
      const preferences = {
        ageRange,
        heightRange: isHeightCustomized ? heightRange : [140, 220],
        location,
        verifiedOnly: isVerified,
        languages: languagesToSave || languages, // Use passed languages or current state
        relationshipType: relationshipTypeArray,
        lifestyleChoices,
        educationLevel,
        zodiacSign: zodiacSignArray,
        familyPlan,
        personality: personalityArray,
        religion,
        similarInterests: showSimilarInterests,
        filtersActive
      };
      
      console.log('🔍 [DEBUG] Saving preferences to database with languages:', languagesToSave || languages);
      console.log('🔍 [DEBUG] Verified filter being saved:', preferences.verifiedOnly, 'Type:', typeof preferences.verifiedOnly);
      console.log('🔍 [DEBUG] Full preferences object being sent:', JSON.stringify(preferences, null, 2));
      
      console.log('📤 [DEBUG] Saving preferences to database:', {
        userId: currentUser._id,
        endpoint: `${API_BASE_URL}/admin/users/${currentUser._id}/preferences`,
        preferences: preferences
      });
      
      const response = await fetch(`${API_BASE_URL}/admin/users/${currentUser._id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });
      
      console.log('📥 [DEBUG] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Server error response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText.substring(0, 200) // Log first 200 chars
        });
        
        // Retry on 500 errors
        if (response.status === 500 && retryCount < maxRetries) {
          console.log(`🔄 [DEBUG] Retrying database save (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return savePreferencesToDatabase(filtersActive, languagesToSave, retryCount + 1);
        }
        
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [DEBUG] Preferences saved to database:', {
          filtersActive,
          ageRange,
          location
        });
      } else {
        console.error('❌ [DEBUG] Failed to save preferences:', data.error);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error saving preferences to database:', error);
      
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.log(`🔄 [DEBUG] Retrying database save due to error (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return savePreferencesToDatabase(filtersActive, languagesToSave, retryCount + 1);
      }
      
      throw error; // Re-throw if max retries reached
    }
  };

  // Load preferences from database
  const loadPreferencesFromDatabase = async () => {
    if (!currentUser?._id || !token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${currentUser._id}/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Server error loading preferences:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText.substring(0, 200) // Log first 200 chars
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.preferences) {
        const prefs = data.preferences;
        
        // Update local state with database preferences
        if (prefs.ageRange) setAgeRange(prefs.ageRange);
        if (prefs.heightRange) {
          setHeightRange(prefs.heightRange);
          setIsHeightCustomized(true);
        }
        if (prefs.location) setLocation(prefs.location);
        // Only load languages from database if we don't have any locally
        if (prefs.languages && prefs.languages.length > 0 && languages.length === 0) {
          console.log('🔍 [DEBUG] Loading languages from database preferences:', prefs.languages);
          setLanguages(prefs.languages);
        } else if (languages.length === 0) {
          // Default to English if no languages are selected
          console.log('🔍 [DEBUG] No languages found, defaulting to English');
          setLanguages(['English']);
        }
        if (prefs.verifiedOnly !== undefined) {
          console.log('🔍 [DEBUG] Loading verified filter from database:', prefs.verifiedOnly);
          setIsVerified(prefs.verifiedOnly);
        }
        if (prefs.relationshipType) {
          const relationshipTypeValue = Array.isArray(prefs.relationshipType) && prefs.relationshipType.length > 0 
            ? prefs.relationshipType.join(', ') 
            : prefs.relationshipType;
          setRelationshipType(relationshipTypeValue);
        }
        if (prefs.lifestyleChoices) setLifestyleChoices(prefs.lifestyleChoices);
        if (prefs.educationLevel) setEducationLevel(prefs.educationLevel);
        if (prefs.zodiacSign) {
          const zodiacSignValue = Array.isArray(prefs.zodiacSign) && prefs.zodiacSign.length > 0 
            ? prefs.zodiacSign.join(', ') 
            : prefs.zodiacSign;
          setZodiacSign(zodiacSignValue);
        }
        if (prefs.familyPlan) setFamilyPlan(prefs.familyPlan);
        if (prefs.personality) {
          const personalityValue = Array.isArray(prefs.personality) && prefs.personality.length > 0 
            ? prefs.personality.join(', ') 
            : prefs.personality;
          setPersonality(personalityValue);
        }
        if (prefs.religion) setReligion(prefs.religion);
        if (prefs.similarInterests !== undefined) setShowSimilarInterests(prefs.similarInterests);
        
        console.log('📋 [DEBUG] Preferences loaded from database:', {
          filtersActive: prefs.filtersActive,
          ageRange: prefs.ageRange,
          location: prefs.location
        });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading preferences from database:', error);
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
          onPress={() => {
            console.log('🔍 [DEBUG] Navigating to LanguageFilter with languages:', languages);
            navigation.navigate('LanguageFilter', { selectedLanguages: languages });
          }}
        > 
          <View style={styles.menuItemContent}>
            <Text style={styles.menuValue}>
          {(() => {
            const displayText = languages.length > 0 ? languages.join(', ') : 'English';
            console.log('🔍 [DEBUG] Language display text:', {
              languages: languages,
              languagesLength: languages.length,
              displayText: displayText
            });
            return displayText;
          })()}
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
          <TouchableOpacity onPress={() => {
            console.log('🔍 [DEBUG] Verified filter toggle pressed. Current state:', isVerified);
            setIsVerified(!isVerified);
            console.log('🔍 [DEBUG] Verified filter state after toggle:', !isVerified);
          }} activeOpacity={0.7}>
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
              <Text style={styles.menuValue}>{relationshipType !== 'All' ? relationshipType : 'Select relationship type'}</Text>
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
              <Text style={styles.menuValue}>
                {zodiacSign !== 'All' ? zodiacSign : 'Select zodiac sign'}
              </Text>
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
              <Text style={styles.menuValue}>
                {personality !== 'All' ? personality : 'Select personality'}
              </Text>
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

  // Function to explicitly disable verification filter
  const disableVerificationFilter = async () => {
    try {
      console.log('🔍 [DEBUG] Explicitly disabling verification filter...');
      setIsVerified(false);
      
      // Update saved settings
      const filterSettingsString = await AsyncStorage.getItem('filterSettings');
      if (filterSettingsString) {
        const filterSettings = JSON.parse(filterSettingsString);
        filterSettings.isVerified = false;
        await AsyncStorage.setItem('filterSettings', JSON.stringify(filterSettings));
        console.log('🔍 [DEBUG] Updated saved filter settings with isVerified: false');
      }
      
      // Also clear activeFilters
      const activeFiltersString = await AsyncStorage.getItem('activeFilters');
      if (activeFiltersString) {
        const activeFilters = JSON.parse(activeFiltersString);
        activeFilters.isVerified = false;
        await AsyncStorage.setItem('activeFilters', JSON.stringify(activeFilters));
        console.log('🔍 [DEBUG] Updated active filters with isVerified: false');
      }
      
      console.log('✅ Verification filter completely disabled');
    } catch (error) {
      console.error('❌ Error disabling verification filter:', error);
    }
  };

  // Function to reset all filters
  const handleResetFilters = async () => {
    console.log('🔍 [DEBUG] Resetting all filters...');
    setAgeRange([18, 99]);
    setHeightRange([140, 220]);
    setIsHeightCustomized(false);
    setIsVerified(false);
    setShowNearbyOptions(false);
    setShowOthers(false);
    setShowSimilarInterests(false);
    setLocation('All');
    setLanguages(['English']); // Default to English
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
      
      // Reset preferences in database
      if (currentUser?._id && token) {
        const response = await fetch(`${API_BASE_URL}/admin/users/${currentUser._id}/preferences/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('🔄 [DEBUG] Preferences reset in database');
        } else {
          console.error('❌ [DEBUG] Failed to reset preferences:', data.error);
        }
      }
    } catch (error) {
      console.error('Error clearing filter settings:', error);
    }
  };

  // Function to apply filters and fetch filtered users
  const handleApplyFilters = async () => {
    setLoading(true);
    
    try {
      console.log('Applying filters...');
      console.log('Current user ID:', currentUser._id);
      console.log('🔍 [DEBUG] Filter settings being applied:', {
        ageRange,
        heightRange: isHeightCustomized ? heightRange : 'Not customized',
        location: location !== 'All' ? location : 'All locations',
        languages: languages.length > 0 ? languages : 'No languages selected',
        verifiedOnly: isVerified,
        // VERIFICATION FILTER COMPLETELY REMOVED
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
      
      // Save preferences to database with filters active
      await savePreferencesToDatabase(true, languages);
      
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
      
      // Convert string-based filters back to arrays for proper backend processing
      const relationshipTypeArray = relationshipType && relationshipType !== 'All' && typeof relationshipType === 'string' ? relationshipType.split(', ') : relationshipType;
      const zodiacSignArray = zodiacSign && zodiacSign !== 'All' && typeof zodiacSign === 'string' ? zodiacSign.split(', ') : zodiacSign;
      const personalityArray = personality && personality !== 'All' && typeof personality === 'string' ? personality.split(', ') : personality;
      const educationLevelArray = educationLevel && educationLevel !== 'All' && typeof educationLevel === 'string' ? educationLevel.split(', ') : educationLevel;
      const religionArray = religion && religion !== 'All' && typeof religion === 'string' ? religion.split(', ') : religion;
      
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
        relationshipType: relationshipTypeArray !== 'All' ? relationshipTypeArray : null,
        lifestyleChoices: lifestyleChoices.length > 0 ? lifestyleChoices : null,
        educationLevel: educationLevelArray !== 'All' ? educationLevelArray : null,
        zodiacSign: zodiacSignArray !== 'All' ? zodiacSignArray : null,
        familyPlan: familyPlan !== 'All' ? familyPlan : null,
        personality: personalityArray !== 'All' ? personalityArray : null,
        religion: religionArray !== 'All' ? religionArray : null
      };

      console.log('🔍 [DEBUG] SENDING TO BACKEND:', {
        userId: filterData.userId,
        ageRange: filterData.ageRange,
        languages: filterData.languages,
        verifiedOnly: filterData.verifiedOnly,
        totalFilters: Object.keys(filterData).length,
        allFilterData: filterData
      });

      const response = await fetch(`${API_BASE_URL}/admin/users/home/filtered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filterData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        console.log(`Filtered users received: ${data.users?.length || 0} users`);
        
        if (data.users && data.users.length > 0) {
          console.log('First few filtered users:');
          data.users.slice(0, 5).forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || user.username} - Age: ${user.age}, Verified: ${user.verificationStatus}, Languages: ${user.languages?.join(', ') || 'None'}, Religion: ${user.religon || 'None'}`);
          });
        }
        
        // Store filtered users in navigation params to pass to Home screen
        console.log('🚀 [DEBUG] Navigating to HomeScreen with filtered data');
        console.log('🚀 [DEBUG] Filtered users being passed:', {
          count: data.users?.length || 0,
          users: data.users?.map(u => ({
            name: u.name || u.username,
            age: u.age,
            id: u._id || u.id
          })) || []
        });
        console.log('🚀 [DEBUG] Filters being passed:', {
          ageRange,
          heightRange: isHeightCustomized ? heightRange : null,
          location: location !== 'All' ? location : null,
          languages: languages.length > 0 ? languages : null,
          verifiedOnly: isVerified
        });
        
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
            relationshipType: relationshipTypeArray !== 'All' ? relationshipTypeArray : null,
            lifestyleChoices: lifestyleChoices.length > 0 ? lifestyleChoices : null,
            educationLevel: educationLevelArray !== 'All' ? educationLevelArray : null,
            zodiacSign: zodiacSignArray !== 'All' ? zodiacSignArray : null,
            familyPlan: familyPlan !== 'All' ? familyPlan : null,
            personality: personalityArray !== 'All' ? personalityArray : null,
            religion: religionArray !== 'All' ? religionArray : null
          }
        });
        
        console.log('Navigation completed successfully');
      } else {
        console.error('Filter application failed:', data.error);
        Alert.alert('Error', data.error || 'Failed to apply filters');
      }
      
    } catch (error) {
      console.error('Error applying filters:', error);
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
