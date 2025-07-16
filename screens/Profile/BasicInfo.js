import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const BasicInfo = ({ navigation }) => {
  const [name, setName] = useState('Kelvin');
  const [dob, setDob] = useState('16/08/1995');
  const [gender, setGender] = useState('Male');
  const [location, setLocation] = useState('Abuja');

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
        <TouchableOpacity style={styles.inputRow} onPress={() => {}}>
          <Text style={[styles.input, { flex: 1, color: '#fff' }]}>{gender}</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
        <Text style={styles.label}>Current location</Text>
        <TouchableOpacity style={styles.inputRow} onPress={() => {}}>
          <Text style={[styles.input, { flex: 1, color: '#fff' }]}>{location}</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.doneButton} onPress={() => navigation && navigation.goBack()}>
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

export default BasicInfo;
