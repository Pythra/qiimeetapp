import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import { useAuth } from '../../components/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../env';
import PaymentSuccessModal from './components/PaymentSuccessModal';
import ConnectionLimitModal from '../Likes/ConnectionLimitModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const getResponsiveWidth = (phoneWidth, tabletWidth) => isTablet ? tabletWidth : phoneWidth;
const getResponsiveFontSize = (phoneSize, tabletSize) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSpacing, tabletSpacing) => isTablet ? tabletSpacing : phoneSpacing;

const PremiumScreen = ({ navigation, route }) => {
  const { balance, refreshBalance, updateBalance, user: currentUser, refreshUser } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState('false');
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Continue'
  });

  // Format balance with commas
  const formatBalance = (amount) => {
    return amount.toLocaleString();
  };

  // Fetch user's verification status
  const fetchVerificationStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // Fallback to currentUser from AuthContext if no token
        if (currentUser && currentUser.verificationStatus) {
          setVerificationStatus(currentUser.verificationStatus);
        }
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success && response.data.user) {
        const newStatus = response.data.user.verificationStatus || 'false';
        console.log('Fetched verification status:', newStatus);
        setVerificationStatus(newStatus);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      // Fallback to currentUser from AuthContext on error
      if (currentUser && currentUser.verificationStatus) {
        setVerificationStatus(currentUser.verificationStatus);
      }
    }
  };

  // Get verification status display
  const getVerificationStatusDisplay = () => {
    switch (verificationStatus) {
      case 'pending':
        return {
          text: 'Pending',
          style: styles.pendingStatus,
          textStyle: styles.pendingText,
          canNavigate: false
        };
      case 'verified':
        return {
          text: 'Verified',
          style: styles.verifiedStatus,
          textStyle: styles.verifiedText,
          canNavigate: false
        };
      case 'true':
        return {
          text: null,
          style: null,
          textStyle: null,
          canNavigate: true
        };
      case 'rejected':
        return {
          text: 'Rejected',
          style: styles.rejectedStatus,
          textStyle: styles.rejectedText,
          canNavigate: true
        };
      default:
        return {
          text: null,
          style: null,
          textStyle: null,
          canNavigate: true
        };
    }
  };

  // Handle verification card press
  const handleVerificationPress = () => {
    const { canNavigate } = getVerificationStatusDisplay();
    
    // If verification is pending, show VerificationInProgress screen
    if (verificationStatus === 'pending') {
      navigation.navigate('VerificationInProgress');
      return;
    }
    
    // If verification is verified, allow access to view/update verification
    if (verificationStatus === 'verified' || verificationStatus === 'true') {
      navigation.navigate('ProfileVerification');
      return;
    }
    
    // For all other statuses (rejected, default), go to verification flow
    if (canNavigate) {
      navigation.navigate('ProfileVerification');
    }
  };

  // Show payment success modal
  const showPaymentSuccess = (title, subtitle, buttonText = 'Continue') => {
    setPaymentSuccessData({ title, subtitle, buttonText });
    setShowPaymentSuccessModal(true);
  };

  // Handle payment success modal close
  const handlePaymentSuccessClose = () => {
    setShowPaymentSuccessModal(false);
  };

  // Check if user has existing connections or requests
  const hasExistingConnectionOrRequest = () => {
    if (!currentUser) return false;
    const hasActiveConnection = currentUser.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser.requests && currentUser.requests.length > 0;
    return hasActiveConnection || hasPendingRequest;
  };

  // Handle Pay for Connection navigation
  const handlePayForConnection = () => {
    // Check if user already has a connection or pending request
    if (hasExistingConnectionOrRequest()) {
      setLimitModalVisible(true);
      return;
    }
    
    // If no existing connections/requests, allow navigation
    navigation.navigate('PayForConnection');
  };

  const handleUpgradeConnections = () => {
    setLimitModalVisible(false);
    try {
      navigation.navigate('PayForConnection');
    } catch (error) {
      console.error('Navigation error:', error);
      navigation.navigate('Premium');
    }
  };

  // Create transaction for successful payment
  const createTransaction = async (amount, referenceOrDescription) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      const isCredit = amount > 0;
      const transactionData = {
        amount: Math.abs(amount),
        description: isCredit ? 'Wallet funding via Paystack' : referenceOrDescription,
        type: isCredit ? 'credit' : 'debit',
        reference: isCredit ? referenceOrDescription : undefined,
        paymentMethod: isCredit ? 'paystack' : 'wallet',
        metadata: isCredit ? {
          source: 'wallet_funding',
          amountInKobo: amount * 100
        } : {
          source: 'connection_payment',
          plan: referenceOrDescription
        }
      };

      console.log('Sending transaction to backend:', transactionData);

      const response = await axios.post(`${API_BASE_URL}/transaction`, transactionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Backend transaction response:', response.data);

      if (response.data.success) {
        console.log('Transaction created successfully:', response.data.transaction);
        // Refresh balance after successful transaction
        await refreshBalance();
      } else {
        Alert.alert('Transaction Error', 'Transaction was not created successfully.');
        console.error('Transaction not successful:', response.data);
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Don't log as error, just show alert
        console.log('Transaction already recorded, skipping duplicate creation');
      } else if (error.response) {
        Alert.alert('Transaction Error', `Backend error: ${JSON.stringify(error.response.data)}`);
        console.error('Backend error:', error.response.data);
      } else {
        console.error('Error creating transaction:', error);
        Alert.alert('Error', 'Failed to create transaction record');
      }
    }
  };

  useEffect(() => {
    // Fetch verification status on component mount
    fetchVerificationStatus();
    
    // Handle verification submission - refresh user data and status
    if (route.params?.verificationSubmitted) {
      console.log('Verification was submitted, refreshing user data...');
      // Fetch fresh verification status
      fetchVerificationStatus();
      // Also refresh user data in AuthContext to get updated verification status
      if (refreshUser) {
        refreshUser();
      }
      setTimeout(() => {
        // Small delay to ensure backend has processed the verification
        fetchVerificationStatus();
        if (refreshUser) {
          refreshUser();
        }
      }, 1000);
      // Clear the parameter
      navigation.setParams({ verificationSubmitted: undefined });
    }
    
    // Handle payment success and update balance
    if (route.params?.fromPayment && route.params?.amountAdded && route.params?.reference) {
      const amountAdded = route.params.amountAdded;
      const reference = route.params.reference;
      
      // Create transaction record
      createTransaction(amountAdded, reference);
      
      // Update AuthContext balance immediately for better UX
      updateBalance(balance + amountAdded);
      
      // Show success message
      setTimeout(() => {
        showPaymentSuccess(
          'Payment successful!',
          `Successfully added ₦${formatBalance(amountAdded)} to your wallet!`
        );
      }, 500);
      
      // Clear the params to prevent re-adding on re-render
      navigation.setParams({ fromPayment: undefined, amountAdded: undefined, reference: undefined });
    }

    // Handle connection payment deduction
    if (route.params?.fromConnection && route.params?.amountPaid) {
      const amountPaid = route.params.amountPaid;
      const planTitle = route.params.planTitle;

      // Deduct from AuthContext balance immediately
      updateBalance(Math.max(0, balance - amountPaid));

      // Optionally, create a transaction record for the deduction
      createTransaction(-amountPaid, `Connection payment: ${planTitle}`);

      // Show success message
      setTimeout(() => {
        showPaymentSuccess(
          'Payment successful!',
          `₦${formatBalance(amountPaid)} has been deducted for your connection!`
        );
      }, 500);

      // Clear the params to prevent double deduction
      navigation.setParams({ fromConnection: undefined, amountPaid: undefined, planTitle: undefined });
    }

    // Handle subscription payment deduction
    if (route.params?.fromSubscription && route.params?.amountPaid) {
      const amountPaid = route.params.amountPaid;
      const planTitle = route.params.planTitle;

      // Deduct from AuthContext balance immediately
      updateBalance(Math.max(0, balance - amountPaid));

      // Optionally, create a transaction record for the deduction
      createTransaction(-amountPaid, `Subscription payment: ${planTitle}`);

      // Show success message
      setTimeout(() => {
        showPaymentSuccess(
          `${planTitle} subscription successful!`,
          `₦${formatBalance(amountPaid)} has been deducted for your ${planTitle} subscription!`
        );
      }, 500);

      // Clear the params to prevent double deduction
      navigation.setParams({ fromSubscription: undefined, amountPaid: undefined, planTitle: undefined });
    }
  }, [route.params, navigation, balance, updateBalance, refreshBalance]);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh balance and verification status when screen comes into focus
      refreshBalance();
      fetchVerificationStatus();
    }, [refreshBalance])
  );

  // Also update verification status when currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.verificationStatus) {
      console.log('CurrentUser verification status changed:', currentUser.verificationStatus);
      setVerificationStatus(currentUser.verificationStatus);
    }
  }, [currentUser?.verificationStatus]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      > 
        <TouchableOpacity
          style={styles.verificationCard}
          onPress={handleVerificationPress}
          disabled={verificationStatus === 'verified' || verificationStatus === 'pending'}
        >
          <View style={styles.verificationContent}>
            <View style={styles.verificationHeader}>
              <Text style={styles.verificationText}>Verify Your Profile</Text>
              {getVerificationStatusDisplay().text && (
                <View style={getVerificationStatusDisplay().style}>
                  <Text style={getVerificationStatusDisplay().textStyle}>
                    {getVerificationStatusDisplay().text}
                  </Text>
                </View>
              )}
            </View>
            <View style={{marginTop: getResponsiveSpacing(4, 6)}}>
            <Text style={styles.verificationSubtext}>
              {verificationStatus === 'rejected' 
                ? 'Your verification was rejected. Tap to try again with new documents.' 
                : 'Verify your profile to stay secure and connect with real matches'}
            </Text>
            </View>
          </View>
          <MaterialIcons 
            name="chevron-right" 
            size={getResponsiveWidth(32)} 
            color="#fff" 
          />
        </TouchableOpacity>
 
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>₦{formatBalance(balance)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.balanceButton}
              onPress={() => navigation.navigate('FundWallet')}
            >
              <MaterialIcons 
                name="add-circle" 
                size={getResponsiveWidth(40)} 
                color="rgba(255, 255, 255, 0.5)" 
              />
              <Text style={styles.buttonText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pay For Connection Section */}
        <TouchableOpacity 
          style={styles.verificationCard}
          onPress={handlePayForConnection}
        >
          <View style={styles.verificationContent}>
            <View style={styles.titleWithIcon}>
              <Image 
                source={require('../../assets/bicon.png')}
                style={styles.flicon}
              />
              <Text style={styles.verificationText}>Pay For Connection</Text>
            </View>
            <Text style={styles.verificationSubtext}>
              Pay to connect and meet someone now
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Get Premium Section */}
        <View style={styles.premiumSection}>
          <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Get Premium</Text>
            <TouchableOpacity style={styles.subscribeButton} onPress={() => navigation.navigate('SubscriptionScreen')}>
              <Text style={styles.subscribeText}>Subscribe</Text>
            </TouchableOpacity>


            <View style={styles.featuresContainer}>
            <View style={styles.featureHeaderRow}>
              <Text style={styles.featureHeaderText}>Free</Text>
              <Text style={styles.featureHeaderText}>Premium</Text>
            </View>
 

            <View style={styles.featureRow}>
              <Text style={styles.featureLabel}>See who liked you</Text>
              <View style={styles.iconContainer}>
                <View>
                  <MaterialIcons name="close" size={24} color="#fff" />
                </View>
                <View>
                  <MaterialIcons name="check" size={24} color="#fff" />
                </View>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Text style={styles.featureLabel}>Undo accidental left swipes</Text>
              <View style={styles.iconContainer}>
                <View >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </View>
                <View >
                  <MaterialIcons name="check" size={24} color="#fff" />
                </View>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Text style={styles.featureLabel}>Get advanced filters</Text>
              <View style={styles.iconContainer}>
                <View >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </View>
                <View  >
                  <MaterialIcons name="check" size={24} color="#fff" />
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('AllFeatures')}>
              <Text style={styles.allFeaturesText}>All Features</Text>
            </TouchableOpacity>
          </View></View>
        </View>
      </ScrollView>
      <PaymentSuccessModal
        visible={showPaymentSuccessModal}
        onContinue={handlePaymentSuccessClose}
        title={paymentSuccessData.title}
        subtitle={paymentSuccessData.subtitle}
        buttonText={paymentSuccessData.buttonText}
      />
      
      <ConnectionLimitModal 
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
        onUpgrade={handleUpgradeConnections}
        currentConnections={currentUser?.allowedConnections || 0}
        maxConnections={currentUser?.allowedConnections || 0}
        hasPendingRequest={hasExistingConnectionOrRequest()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
    paddingBottom:56
  },
  contentContainer: {
    padding: 16,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  verificationCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: getResponsiveSpacing(12, 16),
    padding: getResponsiveSpacing(16, 20),
    marginTop: getResponsiveSpacing(20, 30),
    marginBottom: getResponsiveSpacing(15, 20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#0a0a0a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16, 
    flexShrink: 1, // Allow text to shrink and wrap
    flexWrap: 'wrap', // Enable wrapping
  },
  verificationContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(10, 15),
  },
  verificationText: {
    color: '#fff',
    fontSize: 16, 
  },
  verificationSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  balanceSection: {
    marginBottom: getResponsiveSpacing(15, 20),
    width: '100%',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSpacing(20, 30),
    width: '100%',
  },
  balanceInfo: {
    width: '47%', // Change from flex: 1 to fixed percentage
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius:8,
    paddingVertical: 24,
    height: 96, 
    marginVertical: 6,
    gap: 8, // Add gap between label and amount
  },
  balanceButton: { 
    width: '47%', // Match balanceInfo width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 16, 
    height: 96,
    marginVertical: 6,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16, 
    marginBottom: getResponsiveSpacing(4, 6),
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight:'600', 
  },
  premiumSection: {
    marginTop: getResponsiveSpacing(10, 15),
    marginBottom:56
  },
  subscribeButton: {
    backgroundColor: '#ec066a',
    borderRadius: getResponsiveSpacing(90),
    padding: getResponsiveSpacing(14, 18),
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(20, 25),
    width: '100%',
  },
  subscribeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(24), 
    fontWeight: '700',
  },
  featuresContainer: {
    backgroundColor: '#292929',
    padding: getResponsiveSpacing(16, 20), 
    borderRadius: getResponsiveSpacing(12, 16),
    gap: getResponsiveSpacing(10, 15),
  },
  cardContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: getResponsiveSpacing(20, 24),
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(24), 
    fontWeight: '600',
    alignSelf: 'center',
    marginBottom: 16,
  },
  featureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 10, // Matches the iconContainer marginRight
    marginBottom: 15,
    width: '100%',
    gap: 16, // Add gap between Free and Premium text
  },
  featureHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.medium,
    width: 50, // Reduced width to match icons better
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: getResponsiveSpacing(12, 15),
  },
  featureLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(14, 16),
    fontFamily: FONTS.regular,
    flex: 1,
    marginRight: getResponsiveSpacing(20, 30),
  },
  iconContainer: {
    flexDirection: 'row',
    width: 90,  // Reduced from 120
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight:20, // Added margin to pull icons left
  },
  closeIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#666',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#ec066a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allFeaturesText: {
    color: '#ec066a',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: getResponsiveSpacing(5, 10),
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  flicon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingStatus: {
    backgroundColor: 'rgba(242, 147, 57, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 48,
  },
  verifiedStatus: {
    backgroundColor: 'rgba(110, 197, 49, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 48,
  },
  rejectedStatus: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 48,
  },
  pendingText: {
    color: '#f29339',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  verifiedText: {
    color: '#6ec531',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  rejectedText: {
    color: '#ef4444',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
});

export default PremiumScreen;