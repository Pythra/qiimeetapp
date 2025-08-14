import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const Bio = ({ navigation, route }) => {
  const [bio, setBio] = useState(route?.params?.bio || '');

  return (
    <View style={styles.container}>
      <TopHeader title="Bio" onBack={() => navigation && navigation.goBack()} />
      <Text style={styles.label}>Write a short bio about yourself</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={setBio}
        placeholder="Add your bio..."
        placeholderTextColor="#888"
        multiline
        maxLength={300}
      />
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: bio.trim() ? '#EC066A' : '#292929' }]}
        disabled={!bio.trim()}
        onPress={() => navigation.navigate('EditProfile', { bio: bio.trim() })}
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
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  doneButton: {
    borderRadius: 90,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginBottom: 56,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
});

export default Bio; 