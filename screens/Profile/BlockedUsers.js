import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import TopHeader from '../../components/TopHeader';
import Colors from '../../constants/Colors';
import { FONTS } from '../../constants/font';
import { MaterialIcons } from '@expo/vector-icons';

const blockedUsers = [
  {
    id: '1',
    name: 'Jennifer',
    age: 24,
    avatar: require('../../assets/girl2.jpg'),
    verified: true,
  },
  {
    id: '2',
    name: 'Jennifer',
    age: 24,
    avatar: require('../../assets/girl2.jpg'),
    verified: true,
  },
  {
    id: '3',
    name: 'Jennifer',
    age: 24,
    avatar: require('../../assets/girl2.jpg'),
    verified: true,
  },
];

const BlockedUsers = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopHeader title="Blocked Users" onBack={() => navigation.goBack()} />
      <FlatList
        data={blockedUsers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Image source={item.avatar} style={styles.avatar} />
            <View style={styles.infoRow}>
              <Text style={styles.name}>{item.name}, {item.age} </Text>
              {item.verified && (
                <MaterialIcons name="verified" size={20} color="#ec066a" style={styles.verifiedIcon} />
              )}
            </View>
            <TouchableOpacity style={styles.unblockButton}>
              <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.regular,
    marginRight: 4,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  unblockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
});

export default BlockedUsers;
