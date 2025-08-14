import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import { Ionicons } from '@expo/vector-icons';
import OptionItem from '../intro/forms/OptionItem';

const LocationFilter = ({ navigation }) => {
  const [selectedCountry, setSelectedCountry] = useState('Nigeria');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const allRecommendedLocations = ['Lagos', 'Abuja (FCT)', 'Kaduna', 'Imo', 'Anambra', 'Kano', 'Rivers', 'Oyo', 'Ogun', 'Enugu', 'Anambra', 'Delta', 'Edo', 'Akwa Ibom', 'Cross River', 'Benue', 'Borno', 'Plateau', 'Ondo', 'Osun', 'Ekiti', 'Imo', 'Abia', 'Bauchi', 'Katsina', 'Kebbi', 'Kogi', 'Niger', 'Taraba', 'Yobe', 'Zamfara', 'Sokoto', 'Jigawa', 'Gombe', 'Nasarawa', 'Bayelsa', 'Ebonyi', 'Adamawa'];
  
  // Filter out selected locations from recommended
  const availableRecommended = allRecommendedLocations.filter(
    location => !selectedLocations.includes(location)
  );

  const suggested = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return availableRecommended;
    return availableRecommended.filter(l => l.toLowerCase().includes(q));
  }, [searchText, availableRecommended]);

  const addLocation = (location) => {
    if (!selectedLocations.includes(location)) {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const removeLocation = (location) => {
    setSelectedLocations(selectedLocations.filter(loc => loc !== location));
  };

  const handleSearchSubmit = () => {
    if (searchText.trim() && !selectedLocations.includes(searchText.trim())) {
      addLocation(searchText.trim());
      setSearchText('');
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader title="Location" onBack={() => navigation.goBack()} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search Location"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Only show selected locations container if there are selected locations */}
      {selectedLocations.length > 0 && (
        <View style={styles.selectedLocationsContainer}>
          {selectedLocations.map((location, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.selectedLocationChip}
              onPress={() => removeLocation(location)}
            >
              <Text style={styles.selectedLocationText}>{location}</Text>
              <Ionicons name="close" size={20} color="#fff" style={styles.closeIcon} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Country</Text>
      <View style={styles.countryContainer}>
        <TouchableOpacity style={styles.opaqueOptionItem}>
          <Text style={styles.opaqueOptionText}>{selectedCountry}</Text>
          <View style={[styles.radioButton, styles.radioButtonSelected]}>
            <View style={styles.radioButtonInner} />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recommended Locations</Text>
      <View style={styles.recommendedContainer}>
        {suggested.map((location, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.recommendedItem}
            onPress={() => addLocation(location)}
          >
            <Text style={styles.locationText}>{location}</Text>
          </TouchableOpacity>
        ))}
      </View> 

      <View style={styles.footer}>
        <CustomButton 
          title="Done"
          onPress={() => navigation.goBack()}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 90,
    paddingHorizontal: 15,
    height: 55,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontFamily: FONTS.regular,
    fontSize: 16,
  },
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  selectedLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
  },
  selectedLocationText: {
    color: '#fff',
    marginRight: 5,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  closeIcon: {
    marginLeft: 2,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontFamily: FONTS.regular,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1e1e1e',
    marginBottom: 1,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 35,
    backgroundColor: '#000',
  },
  recommendedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  recommendedItem: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E91E63',
  },
  countryContainer: {
    paddingHorizontal: 20,
  },
  opaqueOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15, 
    backgroundColor: '#1E1E1E',
    marginBottom: 18,
    padding: 16,
    borderRadius: 8,
    height: 55,
  },
  opaqueOptionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  radioButton: {
    height: 16,
    width: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#EC066A',
  },
  radioButtonInner: {
    height: 8,
    width: 8,
    borderRadius: 5,
    backgroundColor: '#EC066A',
  },
});

export default LocationFilter;