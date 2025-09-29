import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';

// Comprehensive language data organized by categories
const languageCategories = {
  nigerian: {
    title: 'Nigerian Languages',
    languages: [
      'Yoruba', 'Igbo', 'Hausa', 'Ibibio', 'Igala', 'Ikwerre', 'Efik', 'Tiv',
      'Nupe', 'Kanuri', 'Fulani', 'Ijaw', 'Urhobo', 'Isoko', 'Itsekiri', 'Edo',
      'Esan', 'Bini', 'Ika', 'Anioma', 'Okpe', 'Uvwie', 'Isoko', 'Urhobo',
      'Izon', 'Kalabari', 'Okrika', 'Ogbia', 'Nembe', 'Brass', 'Abua', 'Odual'
    ]
  },
  foreign: {
    title: 'Foreign Languages',
    languages: [
      'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Dutch',
      'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Russian', 'Polish', 'Czech',
      'Hungarian', 'Romanian', 'Bulgarian', 'Greek', 'Turkish', 'Ukrainian',
      'Belarusian', 'Slovak', 'Slovenian', 'Croatian', 'Serbian', 'Bosnian',
      'Macedonian', 'Albanian', 'Estonian', 'Latvian', 'Lithuanian',
      'Swahili', 'Amharic', 'Zulu', 'Xhosa', 'Shona', 'Kinyarwanda', 'Luganda',
      'Kiswahili', 'Twi', 'Ga', 'Ewe', 'Fante', 'Akan', 'Wolof', 'Mandinka',
      'Bambara', 'Diola', 'Serer', 'Temne', 'Mende', 'Krio', 'Vai', 'Kpelle',
      'Mandarin Chinese', 'Cantonese', 'Japanese', 'Korean', 'Vietnamese',
      'Thai', 'Indonesian', 'Malay', 'Tagalog', 'Hindi', 'Bengali', 'Urdu',
      'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada',
      'Malayalam', 'Sinhala', 'Nepali', 'Sinhalese', 'Burmese', 'Khmer',
      'Lao', 'Mongolian', 'Kazakh', 'Uzbek', 'Kyrgyz', 'Tajik', 'Turkmen',
      'Arabic', 'Hebrew', 'Persian', 'Kurdish', 'Armenian', 'Georgian', 'Azerbaijani',
      'Pashto', 'Dari', 'Sindhi', 'Quechua', 'Guarani', 'Aymara', 'Nahuatl',
      'Maya', 'Zapotec', 'Mixtec', 'Otomi', 'Totonac', 'Mazatec', 'Chinantec',
      'Mixe', 'Chatino', 'Trique', 'Amuzgo'
    ]
  }
};

const Language = ({ navigation, route }) => {
  const [search, setSearch] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('nigerian');
  const hasInitialized = useRef(false);

  // Initialize with existing languages from route params
  useEffect(() => {
    console.log('Language.js useEffect - route.params:', route?.params);
    console.log('Language.js useEffect - current selectedLanguages:', selectedLanguages);
    if (route?.params?.languages && !hasInitialized.current) {
      console.log('Language.js useEffect - setting languages from route params:', route.params.languages);
      setSelectedLanguages(route.params.languages);
      hasInitialized.current = true;
    }
  }, []); // Only run once on mount

  const toggleLanguage = (language) => {
    console.log('Language.js toggleLanguage - before:', selectedLanguages);
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
    console.log('Language.js toggleLanguage - after:', selectedLanguages);
  };

  const removeLanguage = (language) => {
    setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
  };

  const handleSearchSubmit = () => {
    if (search.trim() && !selectedLanguages.includes(search.trim())) {
      setSelectedLanguages([...selectedLanguages, search.trim()]);
      setSearch('');
    }
  };

  const filteredLanguages = Object.keys(languageCategories).map(categoryKey => {
    const category = languageCategories[categoryKey];
    const filtered = category.languages.filter(lang => 
      lang.toLowerCase().includes(search.toLowerCase()) &&
      !selectedLanguages.includes(lang)
    );
    return { ...category, key: categoryKey, filtered };
  });

  const getCategoryIcon = (categoryKey) => {
    const icons = {
      nigerian: 'globe',
      foreign: 'globe'
    };
    return icons[categoryKey] || 'globe';
  };

  return (
    <View style={styles.container}>
      <TopHeader title="Languages" onBack={() => navigation && navigation.goBack()} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search or add custom language"
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="done"
            />
            {search.trim() && (
              <TouchableOpacity onPress={handleSearchSubmit} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#EC066A" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected Languages */}
        {selectedLanguages.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>Selected Languages ({selectedLanguages.length})</Text>
            <View style={styles.selectedLanguagesGrid}>
              {selectedLanguages.map((language, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.selectedLanguageChip}
                  onPress={() => removeLanguage(language)}
                >
                  <Text style={styles.selectedLanguageText}>{language}</Text>
                  <Ionicons name="close" size={16} color="#fff" style={styles.closeIcon} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Category Tabs */}
        <View style={styles.categoryTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(languageCategories).map((categoryKey) => (
              <TouchableOpacity
                key={categoryKey}
                style={[
                  styles.categoryTab,
                  activeCategory === categoryKey && styles.activeCategoryTab
                ]}
                onPress={() => setActiveCategory(categoryKey)}
              >
                <Ionicons 
                  name={getCategoryIcon(categoryKey)} 
                  size={16} 
                  color={activeCategory === categoryKey ? '#EC066A' : '#888'} 
                />
                <Text style={[
                  styles.categoryTabText,
                  activeCategory === categoryKey && styles.activeCategoryTabText
                ]}>
                  {languageCategories[categoryKey].title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Languages Grid */}
        <View style={styles.languagesContainer}>
          {filteredLanguages
            .filter(category => category.key === activeCategory)
            .map(category => (
              <View key={category.key}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <View style={styles.languagesGrid}>
                  {category.filtered.map((language, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.languageTag}
                      onPress={() => toggleLanguage(language)}
                    >
                      <Text style={styles.languageTagText}>{language}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
        </View>

        {/* Show all languages when searching */}
        {search.trim() && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            <View style={styles.languagesGrid}>
              {Object.values(languageCategories)
                .flatMap(category => category.languages)
                .filter(lang => 
                  lang.toLowerCase().includes(search.toLowerCase()) &&
                  !selectedLanguages.includes(lang)
                )
                .map((language, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.languageTag}
                    onPress={() => toggleLanguage(language)}
                  >
                    <Text style={styles.languageTagText}>{language}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Done Button */}
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: selectedLanguages.length > 0 ? '#EC066A' : '#292929' }]}
        onPress={() => {
          console.log('Language.js Done button - selectedLanguages:', selectedLanguages);
          console.log('Language.js Done button - navigating to EditProfile with languages:', selectedLanguages);
          navigation.navigate('EditProfile', { languages: selectedLanguages });
        }}
        disabled={selectedLanguages.length === 0}
      >
        <Text style={styles.doneButtonText}>
          Done {selectedLanguages.length > 0 ? `(${selectedLanguages.length})` : ''}
        </Text>
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
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 90,
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
  searchIcon: {
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  selectedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectedTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedLanguagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
  },
  selectedLanguageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC066A',
    borderRadius: 90,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  selectedLanguageText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginRight: 4,
  },
  closeIcon: {
    marginLeft: 2,
  },
  categoryTabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 90,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  activeCategoryTab: {
    backgroundColor: '#EC066A',
  },
  categoryTabText: {
    color: '#888',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  activeCategoryTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  languagesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.regular,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  languageTag: {
    backgroundColor: '#1e1e1e',
    borderRadius: 90,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  languageTagText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchResultsTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.regular,
    fontWeight: '600',
    marginBottom: 12,
  },
  doneButton: {
    borderRadius: 90,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
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

