import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { FONTS } from '../../constants/font';
import { useNavigation } from '@react-navigation/native';
import TopHeader from '../../components/TopHeader';

const Work = () => {
  const navigation = useNavigation();
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopHeader 
        title="Work"
        onBack={() => navigation.goBack()}
      />
      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Job title</Text>
        <TextInput
          style={styles.input}
          placeholder="Add Job title"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={jobTitle}
          onChangeText={setJobTitle}
        />
        <Text style={[styles.label, { marginTop: 18 }]}>Company</Text>
        <TextInput
          style={styles.input}
          placeholder="Add Company"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={company}
          onChangeText={setCompany}
        />
      </View>
      {/* Done Button */}
      <TouchableOpacity style={styles.doneButton} onPress={() => {
        navigation.navigate('EditProfile', { work: { jobTitle, company } });
      }}>
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
  },
  form: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  doneButton: {
    backgroundColor: '#ec066a',
    borderRadius: 90,
    marginHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 56,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
});

export default Work;