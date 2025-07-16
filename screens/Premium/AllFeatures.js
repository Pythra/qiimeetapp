import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const AllFeatures = ({ navigation }) => {
  const featureImages = [
    require('../../assets/ashheart.png'),
    require('../../assets/ashbounds.png'),
    require('../../assets/ashback.png'),
    require('../../assets/ashcards.png'),
    require('../../assets/ashfilter.png'),
    require('../../assets/ashcognito.png'),
  ];
  const features = [
    {
      title: 'See who liked you',
      subtitle: 'Unlock the people who have already sent you a like.',
    },
    {
      title: 'Remove ads',
      subtitle: 'Turn off all ads shown in the app.',
    },
    {
      title: 'Undo accidental left swipes',
      subtitle: 'The ability to undo a no vote.',
    },
    {
      title: 'Never run out of swipes',
      subtitle: 'Get unlimited swipes on Discover.',
    },
    {
      title: 'Get advanced filters',
      subtitle: 'Use advanced filters options to better find your perfect connection.',
    },
    {
      title: 'Go incognito',
      subtitle: 'View other people’s profiles without notifying them that you viewed it. Hide your profile.',
    },
  ];

  return (
    <View style={styles.container}>
      <TopHeader title="All Features" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.content}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={styles.iconContainer}>
              <Image
                source={featureImages[index]}
                style={{ width: 48, height: 48, resizeMode: 'contain' }}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            </View>
          </View>
        ))}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.subscribeButton}>
            <Text style={styles.subscribeText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flex: 1,
    paddingHorizontal: 20,
  },
  featureRow: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48, 
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  featureSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  buttonContainer: {
    paddingVertical: 16,
    marginBottom: 36,
  },
  subscribeButton: {
    backgroundColor: '#ec066a',
    padding: 16,
    borderRadius: 90,
    alignItems: 'center',
  },
  subscribeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.medium,
  },
});

export default AllFeatures;
