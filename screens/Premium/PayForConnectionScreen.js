import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../components/AuthContext';

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



const PayForConnectionScreen = ({ navigation }) => {
  const { user: currentUser, updateUser, refreshUser, balance: userBalance } = useAuth();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);
  const [loading, setLoading] = useState(false);
  const [insufficientBalanceModalVisible, setInsufficientBalanceModalVisible] = useState(false);
  const [connectionOptions, setConnectionOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [requiredAmount, setRequiredAmount] = useState(0);

  // Memoize user data calculations to avoid recalculating on every render
  const userData = useMemo(() => {
    const allowedConnections = currentUser?.allowedConnections || 0;
    const usedConnections = currentUser?.usedConnections || 0;
    const remainingConnections = currentUser?.remainingConnections || 0;
    const availableConnectionsLeftToBuy = Math.max(0, 3 - allowedConnections);
    
    return {
      allowedConnections,
      usedConnections,
      remainingConnections,
      availableConnectionsLeftToBuy
    };
  }, [currentUser?.allowedConnections, currentUser?.usedConnections, currentUser?.remainingConnections, currentUser?.availableConnectionsLeftToBuy]);

  // Only refresh user data if it's stale (older than 30 seconds)
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const shouldRefresh = !currentUser || (now - lastRefreshTime > 30000); // 30 seconds
      
      if (shouldRefresh) {
        setLastRefreshTime(now);
        refreshUser();
      }
    }, [currentUser, lastRefreshTime, refreshUser])
  );

  // Fetch connection options when component mounts
  useFocusEffect(
    useCallback(() => {
      console.log('Component focused, fetching connection options...');
      fetchConnectionOptions();
    }, [])
  );

  // Debug: Log current connection options state
  useEffect(() => {
    console.log('Current connection options:', connectionOptions);
  }, [connectionOptions]);

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
        <CircularProgress step={userData.usedConnections} total={userData.allowedConnections} />
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

  // Fetch connection options from API
  const fetchConnectionOptions = async () => {
    try {
      setLoadingOptions(true);
      console.log('Fetching connection options from:', `${API_BASE_URL}/transaction/connection-fees`);
      const response = await axios.get(`${API_BASE_URL}/transaction/connection-fees`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Format the data to match the expected structure
        const formattedOptions = response.data.fees.map(fee => ({
          title: fee.title,
          price: `₦${fee.price.toLocaleString()}`,
          originalPrice: `₦${fee.originalPrice.toLocaleString()}`,
          description: fee.description,
          connections: fee.connections || 1
        }));
        console.log('Formatted options:', formattedOptions);
        setConnectionOptions(formattedOptions);
      } else {
        console.error('Failed to fetch connection options:', response.data);
        // Fallback to hardcoded options if API fails
        setConnectionOptions([
          {
            title: 'Single Connection',
            price: '₦5,000',
            originalPrice: '₦6,500',
            description: 'Connect with one person',
            connections: 1
          },
          {
            title: 'Two Connections',
            price: '₦8,500',
            originalPrice: '₦10,000',
            description: 'Connect with two people',
            connections: 2
          },
          {
            title: 'Three Connections',
            price: '₦10,000',
            originalPrice: '₦12,000',
            description: 'Connect with three people',
            connections: 3
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching connection options:', error);
      // Fallback to hardcoded options if API fails
      setConnectionOptions([
        {
          title: 'Single Connection',
          price: '₦5,000',
          originalPrice: '₦6,500',
          description: 'Connect with one person',
          connections: 1
        },
        {
          title: 'Two Connections',
          price: '₦8,500',
          originalPrice: '₦10,000',
          description: 'Connect with two people',
          connections: 2
        },
        {
          title: 'Three Connections',
          price: '₦10,000',
          originalPrice: '₦12,000',
          description: 'Connect with three people',
          connections: 3
        },
      ]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOptionPress = (index) => {
    setSelectedOption(index);
  };

  const handleContinue = async () => {
    const selectedPlan = connectionOptions[selectedOption];
    const price = parseInt(selectedPlan.price.replace(/[^\d]/g, ''), 10);
    const connectionsToAdd = selectedPlan.connections || 1;
    
    if (userBalance < price) {
      setRequiredAmount(price);
      setInsufficientBalanceModalVisible(true);
      return;
    }
    
    setLoading(true);
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
        // Update AuthContext with the updated user data
        const updatedUserData = {
          ...currentUser,
          balance: response.data.balance,
          allowedConnections: response.data.allowedConnections,
          remainingConnections: response.data.remainingConnections,
          availableConnectionsLeftToBuy: Math.max(0, 3 - response.data.allowedConnections)
        };
        updateUser(updatedUserData);
        
        // Navigate immediately without additional API calls
        navigation.navigate('PremiumScreen', {
          amountPaid: price,
          fromConnection: true,
          planTitle: selectedPlan.title,
        });
      }
    } catch (error) {
      console.error('Transaction error:', error);
      // Navigate even if there's an error (deductions work correctly)
      navigation.navigate('PremiumScreen', {
        amountPaid: price,
        fromConnection: true,
        planTitle: selectedPlan.title,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = () => {
    setInsufficientBalanceModalVisible(false);
    navigation.navigate('FundWallet');
  };

  const renderConnectionOptions = () => {
    if (loadingOptions) {
      return (
        <View style={styles.optionsWrapper}>
          <View style={styles.optionsContainer}>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
              Loading connection options...
            </Text>
          </View>
        </View>
      );
    }

    if (!connectionOptions || connectionOptions.length === 0) {
      return (
        <View style={styles.optionsWrapper}>
          <View style={styles.optionsContainer}>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
              No connection options available
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              Please check with admin or try again later
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.optionsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}
          style={styles.optionsScrollView}
        >
          {connectionOptions.map((option, idx) => {
            // Calculate if this option should be disabled
            const connectionsToAdd = option.connections || 1;
            const maxAllowed = 3;
            const wouldExceedLimit = (userData.allowedConnections + connectionsToAdd) > maxAllowed;
            const isDisabled = wouldExceedLimit;
            
            return (
              <TouchableOpacity 
                key={idx}
                style={[
                  styles.optionButton,
                  selectedOption === idx ? styles.optionButtonActive : styles.optionButtonInactive,
                  isDisabled && { opacity: 0.4 }
                ]}
                onPress={() => !isDisabled && handleOptionPress(idx)}
                activeOpacity={isDisabled ? 1 : 0.7}
                disabled={isDisabled}
              >
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionPrice}>{option.price}</Text>
                <Text style={styles.originalPrice}>{option.originalPrice}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                {isDisabled && (
                  <Text style={{ color: '#ec066a', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                    Would exceed limit
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {userData.allowedConnections >= 3 && (
          <Text style={{ color: '#ec066a', fontSize: 14, textAlign: 'center', marginTop: 12 }}>
            You have reached the maximum number of connections you can buy.
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {renderHeader()}
      
      {/* Carousel for top slide */}
      <View style={styles.carouselContainer}>
        <Carousel
          loop={true}
          width={width}
          height={260}
          data={carouselData}
          autoPlay={false} // Disabled auto-play for better performance
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
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Processing...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <InsufficientBalanceModal 
        visible={insufficientBalanceModalVisible}
        onClose={() => setInsufficientBalanceModalVisible(false)}
        onFundWallet={handleFundWallet}
        currentBalance={userBalance}
        requiredAmount={requiredAmount}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
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
    marginBottom:24,
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