import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import { useAuth } from '../../components/AuthContext';

const NIGERIAN_STATES = [
  'Abuja', 'Lagos', 'Kano', 'Kaduna', 'Katsina', 'Oyo', 'Rivers', 'Bauchi', 'Jigawa', 'Benue',
  'Borno', 'Delta', 'Edo', 'Enugu', 'Imo', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger',
  'Ondo', 'Osun', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Abia', 'Adamawa', 'Akwa Ibom',
  'Anambra', 'Bayelsa', 'Cross River', 'Ebonyi', 'Ekiti', 'Gombe', 'Kano', 'Kebbi', 'Kogi', 'Kwara'
];

const BasicInfo = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('16/08/1995');
  const [gender, setGender] = useState('Male');
  const [location, setLocation] = useState('Abuja');
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.username || '');
      setGender(user.gender || 'Male');
      setLocation(user.location || 'Abuja');
      // Optionally set dob if available
      // setDob(user.dateOfBirth || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { username: name, gender, location },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update AuthContext with the new user data
      updateUser(response.data);
      
      navigation && navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update info.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStates = NIGERIAN_STATES.filter(state =>
    state.toLowerCase().includes(locationSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TopHeader title="Basic info" onBack={() => navigation && navigation.goBack()} />
      <View style={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#888"
        />
        <Text style={styles.label}>Date of birth</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={dob}
            onChangeText={setDob}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#888"
            editable={false}
          />
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="calendar" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Gender</Text>
        <TouchableOpacity style={styles.inputRow} onPress={() => setGenderModalVisible(true)}>
          <Text style={[styles.input, { flex: 1, color: '#fff' }]}>{gender}</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
        <Text style={styles.label}>Current location</Text>
        <TouchableOpacity style={styles.inputRow} onPress={() => setLocationModalVisible(true)}>
          <Text style={[styles.input, { flex: 1, color: '#fff' }]}>{location}</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.doneButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.doneButtonText}>Done</Text>}
      </TouchableOpacity>

      {/* Gender Modal */}
      <Modal visible={genderModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalBox}>
            <Text style={modalStyles.modalTitle}>Select Gender</Text>
            {['Male', 'Female'].map(option => (
              <TouchableOpacity
                key={option}
                style={modalStyles.radioRow}
                onPress={() => { setGender(option); setGenderModalVisible(false); }}
              >
                <Ionicons
                  name={gender === option ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={gender === option ? '#EC066A' : '#888'}
                  style={{ marginRight: 10 }}
                />
                <Text style={modalStyles.radioLabel}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setGenderModalVisible(false)} style={modalStyles.closeBtn}>
              <Text style={modalStyles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal visible={locationModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalBox}>
            <Text style={modalStyles.modalTitle}>Select State</Text>
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Search state..."
              placeholderTextColor="#888"
              value={locationSearch}
              onChangeText={setLocationSearch}
            />
            <FlatList
              data={filteredStates}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={modalStyles.stateRow}
                  onPress={() => { setLocation(item); setLocationModalVisible(false); setLocationSearch(''); }}
                >
                  <Text style={modalStyles.stateLabel}>{item}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 250 }}
              keyboardShouldPersistTaps="handled"
            />
            <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={modalStyles.closeBtn}>
              <Text style={modalStyles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
    paddingHorizontal: 4,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  iconBtn: {
    padding: 10,
  },
  doneButton: {
    backgroundColor: '#EC066A',
    borderRadius: 55,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 32,
    bottom: 40,
    position: 'absolute',
    width: '90%',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
    fontFamily: FONTS.regular,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  radioLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  closeBtn: {
    marginTop: 18,
    alignSelf: 'center',
  },
  closeBtnText: {
    color: '#EC066A',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  searchInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: '100%',
  },
  stateRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    width: '100%',
  },
  stateLabel: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
});

export default BasicInfo;
