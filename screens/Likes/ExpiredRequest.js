import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const ExpiredRequest = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
        <TopHeader 
        title=""
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Image
          source={require('../../assets/sadface.png')}
          style={styles.sadFaceIcon}
        />

        <Text style={styles.title}>Connection Request Expired</Text>
        <Text style={styles.description}>
          Your connection request has expired. Don't worry, you can always try again by reconnecting or simply canceling the request.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.reconnectButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.reconnectText}>Reconnect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop:32
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginTop: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
  },
  sadFaceIcon: {
    width: 178,
    height: 178,
    tintColor: '#ec066a',
    marginBottom: 65,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20, 
    bottom: 64,
    width: '100%',
  },
  reconnectButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 90,
    width: '100%',
    marginBottom: 24,
  },
  reconnectText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight:'700',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 90,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ec066a',
  },
  cancelText: {
    color: '#ec066a',
    fontSize: 24,
    fontWeight:'700',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
});

export default ExpiredRequest; 