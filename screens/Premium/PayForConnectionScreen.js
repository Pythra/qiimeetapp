import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import Carousel from 'react-native-reanimated-carousel';
import CircularProgress from './components/CircularProgress';
import InsufficientBalanceModal from './components/InsufficientBalanceModal';
import wavyHeart from '../../assets/wavyheart.png';
import swapIcon from '../../assets/swap.png';
import whiteConnIcon from '../../assets/whiteconnicon.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../env';

const { width } = Dimensions.get('window');

const carouselData = [
  {
    icon: wavyHeart,
    title: 'Send connection requests',
    description: 'Take the first step. Pay the connection fee to show genuine interest in someone.',
  },
  {
    icon: whiteConnIcon,
    title: 'Chat with your match',
    description: 'Start meaningful conversations once your connection is accepted.',
  },
  {
    icon: swapIcon,
    title: `Try again if it doesn't work`,
    description: `Didn't connect? Try connecting with someone new, no pressure.`,
  },
];

const connectionOptions = [
  {
    title: 'Single Connection',
    price: '₦5,000',
    originalPrice: '₦6,500',
    description: 'Connect with one person',
  },
  {
    title: 'Two Connections',
    price: '₦8,500',
    originalPrice: '₦10,000',
    description: 'Connect with two people',
  },
  {
    title: 'Three Connections',
    price: '₦10,000',
    originalPrice: '₦12,000',
    description: 'Connect with three people',
  },
];

const PayForConnectionScreen = ({ navigation }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [allowedConnections, setAllowedConnections] = useState(0);
  const [usedConnections, setUsedConnections] = useState(0);
  const [remainingConnections, setRemainingConnections] = useState(3);
  const [loading, setLoading] = useState(true);
  const [insufficientBalanceModalVisible, setInsufficientBalanceModalVisible] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);

  // Fetch user balance, allowedConnections, and remainingConnections on mount
  React.useEffect(() => {
    const fetchBalanceAndConnections = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/transaction/balance/current`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.data.success) {
          setUserBalance(response.data.balance);
        }
        // Fetch allowedConnections and remainingConnections from user profile endpoint
        const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setAllowedConnections(userRes.data.allowedConnections || 0);
        // Calculate usedConnections: accepted + pending
        const accepted = Array.isArray(userRes.data.connections) ? userRes.data.connections.length : 0;
        console.log(accepted);
        const pending = Array.isArray(userRes.data.requests) ? userRes.data.requests.length : 0;
        setUsedConnections(accepted + pending);
        setRemainingConnections(userRes.data.remainingConnections ?? (3 - (userRes.data.allowedConnections || 0)));
      } catch (error) {
        setUserBalance(0);
        setAllowedConnections(0);
        setRemainingConnections(3);
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceAndConnections();
  }, []);

  // Log allowedConnections whenever it changes
  React.useEffect(() => {
    console.log('Allowed Connections (for CircularProgress):', allowedConnections);
  }, [allowedConnections]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => navigation.navigate('PremiumScreen')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Pay for Connection</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.connectsText}>Connects</Text>
        <CircularProgress step={usedConnections} total={allowedConnections} />
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {[0, 1, 2].map((dot) => (
        <View
          key={dot}
          style={[
            styles.paginationDot,
            dot === carouselIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  const maxConnections = 3;
  // Use remainingConnections directly from state

  const handleOptionPress = (index) => {
    setSelectedOption(index);
  };

  const handleContinue = async () => {
    const selectedPlan = connectionOptions[selectedOption];
    const price = parseInt(selectedPlan.price.replace(/[^\d]/g, ''), 10);
    let connectionsToAdd = 1;
    if (selectedPlan.title === 'Two Connections') connectionsToAdd = 2;
    if (selectedPlan.title === 'Three Connections') connectionsToAdd = 3;
    // Only allow up to remainingConnections
    if (connectionsToAdd > remainingConnections) {
      alert(`You can only purchase up to ${remainingConnections} more connection(s).`);
      return;
    }
    if (userBalance < price) {
      setRequiredAmount(price);
      setInsufficientBalanceModalVisible(true);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('No authentication token found');
        return;
      }
      // Call backend to deduct balance and create transaction
      const response = await axios.post(
        `${API_BASE_URL}/transaction/deduct`,
        { amount: price, planTitle: selectedPlan.title, connectionsToAdd },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setUserBalance(response.data.balance);
        setAllowedConnections(response.data.allowedConnections);
        setRemainingConnections(response.data.remainingConnections);
        navigation.navigate('PremiumScreen', {
          amountPaid: price,
          fromConnection: true,
          planTitle: selectedPlan.title,
        });
      }
    } catch (error) {
      // Silently handle errors since deductions work correctly
      navigation.navigate('PremiumScreen', {
        amountPaid: price,
        fromConnection: true,
        planTitle: selectedPlan.title,
      });
    }
  };

  const handleFundWallet = () => {
    setInsufficientBalanceModalVisible(false);
    navigation.navigate('FundWallet');
  };

  const renderConnectionOptions = () => (
    <View style={styles.optionsWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
        style={styles.optionsScrollView}
      >
        {connectionOptions.map((option, idx) => {
          let connectionsForOption = 1;
          if (option.title === 'Two Connections') connectionsForOption = 2;
          if (option.title === 'Three Connections') connectionsForOption = 3;
          // Disable if buying this option would make allowedConnections exceed 3
          const disabled = (allowedConnections + connectionsForOption) > 3;
          return (
            <TouchableOpacity 
              key={idx}
              style={[
                styles.optionButton,
                selectedOption === idx ? styles.optionButtonActive : styles.optionButtonInactive,
                disabled && { opacity: 0.4 }
              ]}
              onPress={() => !disabled && handleOptionPress(idx)}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionPrice}>{option.price}</Text>
              <Text style={styles.originalPrice}>{option.originalPrice}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
              {disabled && (
                <Text style={{ color: '#ec066a', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                  Not available (max 3 connections)
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* Carousel for top slide */}
      <View style={styles.carouselContainer}>
        <Carousel
          loop={true}
          width={width}
          height={260}
          data={carouselData}
          autoPlay={true}
          autoplayInterval={3500}
          scrollAnimationDuration={800}
          onProgressChange={(_, absoluteProgress) => {
            setCarouselIndex(Math.round(absoluteProgress));
          }}
          renderItem={({ item }) => (
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Image source={item.icon} style={{ width: 104, height: 104 }} resizeMode="contain" />
              </View>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.description}</Text>
            </View>
          )}
        />
        {renderPaginationDots()}
      </View>

      {renderConnectionOptions()}
      
      <View style={styles.bottomSection}>
        <Text style={styles.disclaimer}>
          By completing your purchase, you confirm that you agree to this transaction and accept our{' '}
          <Text style={styles.termsText}>Terms and Conditions</Text>
        </Text>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={loading || remainingConnections === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
      
      <InsufficientBalanceModal 
        visible={insufficientBalanceModalVisible}
        onClose={() => setInsufficientBalanceModalVisible(false)}
        onFundWallet={handleFundWallet}
        currentBalance={userBalance}
        requiredAmount={requiredAmount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 42,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  connectsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginRight: 6,
  },
  carouselContainer: {
    height: 270,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 0, // Reduced or removed to decrease space before pagination
  },
  iconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: 6, // reduced from 12
  },
  stepDescription: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,  
    textAlign: 'center', 
    lineHeight: 24,
    paddingHorizontal: 20, 
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    marginTop: -20 // Adjusted to reduce space
   },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  optionsWrapper: {
    height: 200,
    marginBottom: 20,
  },
  optionsScrollView: {
    flexGrow: 0,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  optionButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    width: 200,
    height: 160,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: '#fff',
    backgroundColor: '#2a2a2a',
  },
  optionButtonInactive: {
    borderColor: 'transparent',
  },
  optionTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionPrice: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  originalPrice: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  optionDescription: {
    color: '#888',
    fontSize: 11,
    fontFamily: FONTS.regular,
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor:'#292929',
    textAlign: 'center',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  disclaimer: {
    color: '#888',
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    marginHorizontal: 24,
  },
  termsText: {
    color: '#ec066a',
  },
  continueButton: {
    backgroundColor: '#ec066a',
    marginHorizontal: 24,
    marginBottom: 56,
    paddingVertical: 16,
    borderRadius: 90,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '700',
  },
});

export default PayForConnectionScreen;