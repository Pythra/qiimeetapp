import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const notifications = [
  {
    id: 1,
    avatar: require('../../assets/model3.jpg'),
    title: 'Jennifer visited your profile',
    subtitle: '',
  },
  {
    id: 2,
    avatar: require('../../assets/model1.jpg'),
    title: "You've got a new message.",
    subtitle: 'Start a meaningful chat.. love might be just one reply away!',
  },
  {
    id: 3,
    avatar: require('../../assets/model2.jpg'),
    title: 'New match alert!',
    subtitle: 'You both liked each other, ready to connect?',
  },
  {
    id: 4,
    avatar: require('../../assets/model1.jpg'),
    title: 'Connection request accepted!',
    subtitle: 'You\'re now connected, go on, start a conversation.',
  },
  {
    id: 5,
    avatar: require('../../assets/guy1.jpg'),
    title: 'Connection request sent.',
    subtitle: "We've let them know you\'re interested. Fingers crossed",
  },
];

const Notification = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopHeader title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.map((item) => (
          <View key={item.id} style={styles.notificationBox}>
            <Image source={item.avatar} style={styles.avatar} />
            <View style={styles.textContent}>
              <Text style={styles.title}>{item.title}</Text>
              {!!item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
            </View>
          </View>
        ))}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 55,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  subtitle: {
    color: '#bbb',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    opacity: 0.8,
    lineHeight: 24,
  },
});

export default Notification;
