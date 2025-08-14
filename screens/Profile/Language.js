import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';

const recommendedLanguages = ['Yoruba', 'Igbo', 'Hausa', 'Ibibio', 'Igala'];

const Language = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="Languages" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Languages"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Text style={styles.recommendedText}>Recommended Languages</Text>
        <View style={styles.languagesContainer}>
          {recommendedLanguages.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.languageTag, selected === lang && styles.selectedLanguageTag]}
              onPress={() => {
                setSelected(lang);
                setSearch(lang);
              }}
            >
              <Text style={styles.languageTagText}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: search.trim() ? '#EC066A' : '#292929' }]}
        onPress={() => {
          if (search.trim()) {
            navigation.navigate('EditProfile', { languages: [search.trim()] });
          }
        }}
        disabled={!search.trim()}
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
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 90,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  recommendedText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 12,
    opacity: 0.5,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: '#222',
    borderRadius: 90,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLanguageTag: {
    backgroundColor: '#EC066A',
  },
  languageTagText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  doneButton: {
    borderRadius: 90,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 56,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
});

export default Language;
