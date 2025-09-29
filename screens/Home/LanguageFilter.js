import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import { Ionicons } from '@expo/vector-icons';

// Comprehensive language data organized by categories (same as Language.js)
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

const LanguageFilter = ({ navigation, route }) => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('nigerian');

  // Initialize with existing languages from route params or default to English
  useEffect(() => {
    if (route?.params?.selectedLanguages && route.params.selectedLanguages.length > 0) {
      setSelectedLanguages(route.params.selectedLanguages);
    } else {
      // Default to English if no languages are selected
      setSelectedLanguages(['English']);
    }
  }, [route?.params?.selectedLanguages]);

  const toggleLanguage = (language) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchText.trim() && !selectedLanguages.includes(searchText.trim())) {
      toggleLanguage(searchText.trim());
      setSearchText('');
    }
  };

  const getCategoryIcon = (categoryKey) => {
    const icons = {
      nigerian: 'globe',
      foreign: 'globe'
    };
    return icons[categoryKey] || 'globe';
  };

  const filteredLanguages = Object.keys(languageCategories).map(categoryKey => {
    const category = languageCategories[categoryKey];
    const filtered = category.languages.filter(language => 
      language.toLowerCase().includes(searchText.toLowerCase()) &&
      !selectedLanguages.includes(language)
    );
    return { ...category, key: categoryKey, filtered };
  });

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
             placeholder="Search or add custom language"
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
          <Text style={styles.selectedTitle}>Selected Languages ({selectedLanguages.length})</Text>
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

      {/* Category Tabs - Only show when not searching */}
      {!searchText.trim() && (
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
                  color={activeCategory === categoryKey ? '#E91E63' : '#666'} 
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
      )}

      <ScrollView style={styles.content}>
                 {/* Show search results when typing */}
         {searchText.trim() ? (
           <View style={styles.searchResultsContainer}>
             <View style={styles.languagesGrid}>
              {Object.values(languageCategories)
                .flatMap(category => category.languages)
                .filter(lang => 
                  lang.toLowerCase().includes(searchText.toLowerCase()) &&
                  !selectedLanguages.includes(lang)
                )
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
          </View>
        ) : (
          /* Show categorized languages when not searching */
          <View style={styles.languagesContainer}>
            {filteredLanguages
              .filter(category => category.key === activeCategory)
              .map(category => (
                <View key={category.key}> 
                  <View style={styles.languagesGrid}>
                    {category.filtered.map((language, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.languageButton}
                        onPress={() => toggleLanguage(language)}
                      >
                        <Text style={styles.languageText}>{language}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton 
          title={`Done ${selectedLanguages.length > 0 ? `(${selectedLanguages.length})` : ''}`}
          onPress={() => {
            // Pass the selected languages back to BasicFilters
            navigation.navigate('BasicFilters', { selectedLanguages: selectedLanguages });
          }}
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
  addButton: {
    padding: 8,
  },
  selectedLanguagesContainer: {
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
  selectedLanguageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
    marginBottom: 8,
    marginRight: 8,
    alignSelf: 'flex-start',
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
  categoryTabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 90,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  activeCategoryTab: {
    backgroundColor: '#E91E63',
  },
  categoryTabText: {
    color: '#666',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  activeCategoryTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
    paddingHorizontal: 15,
    paddingTop: 5,
    gap: 12,
    marginBottom: 20,
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
    paddingHorizontal: 15,
  },
  footer: {
    padding: 20,
    paddingBottom: 35,
  },
});

export default LanguageFilter;
