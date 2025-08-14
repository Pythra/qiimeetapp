import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, TextInput, ScrollView } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const states = [
  'Lagos', 'Abuja', 'Kano', 'Rivers', 'Kaduna', 'Oyo', 'Enugu', 'Anambra', 'Ogun', 'Delta',
  'Edo', 'Akwa Ibom', 'Cross River', 'Benue', 'Borno', 'Plateau', 'Ondo', 'Osun', 'Ekiti', 'Imo',
  'Abia', 'Bauchi', 'Katsina', 'Kebbi', 'Kogi', 'Niger', 'Taraba', 'Yobe', 'Zamfara', 'Sokoto',
  'Jigawa', 'Gombe', 'Nasarawa', 'Bayelsa', 'Ebonyi', 'Adamawa'
];

const LocationScreen = ({ navigation, route }) => {
  const [location, setLocation] = useState(route?.params?.location || '');
  const [loading, setLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);

  const filteredStates = useMemo(() => {
    const q = (location || '').trim().toLowerCase();
    if (!q) return states;
    return states.filter(s => s.toLowerCase().includes(q));
  }, [location]);

  const handleGetLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        setShowStates(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const place = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const addressData = place.length > 0 ? place[0] : null;
      if (addressData && addressData.region) {
        setLocation(addressData.region);
        setShowStates(false);
      } else {
        setShowStates(true);
      }
    } catch (error) {
      setShowStates(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (state) => {
    setLocation(state);
    setShowStates(false);
  };

  return (
    <View style={styles.container}>
      <TopHeader title="Location" onBack={() => navigation && navigation.goBack()} />
      <Text style={styles.label}>Set your location</Text>
      <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation} disabled={loading}>
        <Ionicons name="locate" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.locationButtonText}>{loading ? 'Getting current location...' : 'Use my current location'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.locationButton} onPress={() => setShowStates(!showStates)}>
        <Ionicons name="map" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.locationButtonText}>Select state manually</Text>
      </TouchableOpacity>
      {showStates && (
        <View style={styles.statesWrapper}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type to search Nigerian states"
              placeholderTextColor="#888"
              value={location}
              onChangeText={setLocation}
            />
          </View>
          <ScrollView style={styles.statesList} keyboardShouldPersistTaps="handled">
            {filteredStates.map(state => (
              <TouchableOpacity key={state} style={styles.stateItem} onPress={() => handleStateSelect(state)}>
                <Text style={styles.stateText}>{state}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.selectedLabel}>Selected location:</Text>
        <Text style={styles.selectedValue}>{location || 'None selected'}</Text>
      </View>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: location ? '#EC066A' : '#292929' }]}
        disabled={!location}
        onPress={() => navigation.navigate('EditProfile', { location })}
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
    paddingHorizontal: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 12,
    marginTop: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  statesList: {
    backgroundColor: '#232323',
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 200,
  },
  stateItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stateText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  selectedLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
    opacity: 0.7,
  },
  selectedValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.regular,
    marginTop: 4,
    fontWeight: '600',
  },
  doneButton: {
    borderRadius: 90,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginTop: 32,
    marginBottom: 56,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
});

export default LocationScreen;
