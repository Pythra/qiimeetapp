import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FONTS } from '../../constants/font';

const Account = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopHeader title="Account" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={'+2349122725325'}
            editable={false}
            placeholder="Phone number"
            placeholderTextColor="#888"
          />
          <Ionicons name="checkmark" size={22} color="#888" style={styles.checkIcon} />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <CustomButton title="Update" style={styles.updateButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 8,
  },
  checkIcon: {
    marginLeft: 8,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
  },
  updateButton: {
    width: '90%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 14,
  },
});

export default Account; 