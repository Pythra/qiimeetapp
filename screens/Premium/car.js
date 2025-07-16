import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

const Intropage = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedPayment, setSelectedPayment] = React.useState(null);

  const data = [
    {
      id: '1',
      title: 'Welcome to Asap Pay',
      subtitle: 'Seamlessly convert your funds with ease',
      image: require('../../assets/pel.png'),
    },
    {
      id: '2',
      title: 'Convert with Ease',
      subtitle: 'Easy conversions, no hidden fees',
      image: require('../../assets/conv.png'),
    },
    {
      id: '3',
      title: 'Safe and Secure',
      subtitle: 'We ensure your funds are safe and secure during conversions',
      image: require('../../assets/safe.png'),
    },
  ];

  // Payment options example
  const paymentOptions = [
    { key: 'card', label: 'Pay with Card', subtitle: 'Pay instantly using your debit or credit card.' },
    { key: 'bank', label: 'Pay with Bank', subtitle: 'Pay directly from your bank account.' },
    { key: 'wallet', label: 'Pay with Wallet', subtitle: 'Use your wallet balance for payment.' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  // Get subtitle for selected payment option
  const paymentSubtitle = selectedPayment
    ? paymentOptions.find(opt => opt.key === selectedPayment)?.subtitle
    : 'Choose a payment option below:';

  return (
    <View style={styles.container}>
      {/* Top carousel and pagination */}
      <Carousel
        loop={true}
        width={width}
        height={width}
        data={data}
        renderItem={renderItem}
        scrollEnabled={true}
        autoPlay={true}
        autoplayInterval={3000}
        scrollAnimationDuration={800}
        onProgressChange={(_, absoluteProgress) => {
          setCurrentIndex(Math.round(absoluteProgress));
        }}
      />
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Subtitle above payment options */}
      <Text style={styles.paymentSubtitle}>{paymentSubtitle}</Text>

      {/* Payment options */}
      <View style={styles.footer}>
        {paymentOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.signUpButton, selectedPayment === opt.key && { backgroundColor: '#c40cf2' }]}
            onPress={() => setSelectedPayment(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
        <Text style={styles.accountText}>Don't have an account?</Text>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate('Emailform')}
          activeOpacity={0.8}
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 60,
    paddingBottom: 75
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#2c2c2c',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6f6f6f',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 50,
  }, 
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop:20,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: 'purple',
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },
  activeDot: {
    width: 24,
    backgroundColor: 'purple',
    transition: 'all 0.3s ease',
  },
  // Enhanced footer and button styles
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  signUpButton: {
    backgroundColor: 'purple',
    borderRadius: 25,
    paddingVertical: 15,
    width: '85%',
    alignItems: 'center', 
    marginBottom: 15,
  },
  signUpText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginButton: { 
    marginBottom: 17, 
    borderRadius: 25,
    paddingVertical: 14,
    width: '85%',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 12, 242, 0.05)',
  },
  loginText: {
    color: '#c40cf2',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  accountText: {
    color: '#6f6f6f',
    fontSize: 14,
    marginBottom: 10,
  },
  paymentSubtitle: {
    color: '#6f6f6f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 0,
    fontWeight: '500',
  },
});

export default Intropage;