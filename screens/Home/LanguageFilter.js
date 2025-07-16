import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import { Ionicons } from '@expo/vector-icons';

const LanguageFilter = ({ navigation }) => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [searchText, setSearchText] = useState('');
  const languages = [
    'English',
    'Yoruba',
    'Igbo',
    'Hausa',
    'Pidgin English', 
    'Igala',
    'Ibibio',
    'Ikwerre', 
  ];

  const toggleLanguage = (language) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      toggleLanguage(searchText.trim());
      setSearchText('');
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader 
        title="Languages" 
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search languages"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="done"
          />
        </View>
      </View>

      {selectedLanguages.length > 0 && (
        <View style={styles.selectedLanguagesContainer}>
          {selectedLanguages.map((language, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.selectedLanguageChip}
              onPress={() => toggleLanguage(language)}
            >
              <Text style={styles.selectedLanguageText}>{language}</Text>
              <Ionicons name="close" size={20} color="#fff" style={styles.closeIcon} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recommended Languages</Text>
        <View style={styles.languagesGrid}>
          {languages
            .filter(language => !selectedLanguages.includes(language))
            .map((language, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.languageButton}
              onPress={() => toggleLanguage(language)}
            >
              <Text style={styles.languageText}>{language}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
    marginBottom: 12,
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
  selectedLanguagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  selectedLanguageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
  },
  selectedLanguageText: {
    color: '#fff',
    marginRight: 5,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  closeIcon: {
    marginLeft: 2,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontFamily: FONTS.regular,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 5,
    gap: 12,
  },
  languageButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
  },
  languageText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  footer: {
    padding: 20,
    paddingBottom: 35,
  },
});

export default LanguageFilter;
