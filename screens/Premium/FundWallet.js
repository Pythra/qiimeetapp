import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';

const FundWallet = () => {
  const navigation = useNavigation();

  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [reference, setReference] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const isPollingRef = useRef(false);

  const amounts = [
    { value: '5000', display: '₦5,000' },
    { value: '8500', display: '₦8,500' },
    { value: '10000', display: '₦10,000' },
  ];

  // Get user data and token on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
        
        if (storedToken) {
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });
          setUserData(response.data);
          console.log('User data loaded:', response.data);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      }
    };

    getUserData();
  }, []);

  // Centralized payment verification function
  const verifyPayment = async (source = 'unknown') => {
    // Prevent duplicate verifications
    if (isVerifying || hasVerified || !reference) {
      console.log(`🚫 Verification blocked from ${source}: isVerifying=${isVerifying}, hasVerified=${hasVerified}, reference=${!!reference}`);
      return;
    }

    setIsVerifying(true);
    console.log(`🔍 Starting payment verification from ${source} for reference: ${reference}`);

    try {
      const res = await axios.post(`${API_BASE_URL}/paystack/verify`, {
        reference: reference,
        userId: userData?._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 Verification response (${source}):`, res.data);

      if (res.data.verified) {
        console.log(`✅ Payment verified via ${source}!`);
        setHasVerified(true);
        setShowWebView(false);
        
        // Stop polling if it's running
        if (isPollingRef.current) {
          isPollingRef.current = false;
          setIsPolling(false);
        }

        const amountPaid = res.data.amount ? res.data.amount : parseInt(amount, 10);
        
        // Check if this was already processed
        if (res.data.alreadyProcessed) {
          console.log('⚠️ Payment was already processed, showing success message');
        } else {
          console.log('✅ Payment processed successfully for the first time');
        }
        
        navigation.replace('PremiumScreen', { 
          amountAdded: amountPaid,
          fromPayment: true,
          reference: reference
        });
      } else {
        console.log(`❌ Payment verification failed via ${source}`);
        Alert.alert('Verification Failed', 'Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error(`❌ Verification error (${source}):`, err.response?.data || err.message);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        setHasVerified(true);
        setShowWebView(false);
        
        // Stop polling if it's running
        if (isPollingRef.current) {
          isPollingRef.current = false;
          setIsPolling(false);
        }
        
        const amountPaid = parseInt(amount, 10);
        navigation.replace('PremiumScreen', { 
          amountAdded: amountPaid,
          fromPayment: true,
          reference: reference
        });
      } else {
        Alert.alert('Verification Error', 'Could not verify payment. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset verification state for new payment
  const resetVerificationState = () => {
    setHasVerified(false);
    setIsVerifying(false);
    isPollingRef.current = false;
    setIsPolling(false);
  };

  // Listen for deep links
  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (url.includes('qiimeet://payment/success')) {
        setShowWebView(false);
        await verifyPayment('deep-link');
      } else if (url.includes('qiimeet://payment/cancel')) {
        setShowWebView(false);
        Alert.alert('Payment Cancelled', 'Payment was cancelled.');
      }
    };

    // Listen for URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [navigation, reference, userData, token, isVerifying, hasVerified]);

  // Poll for payment status when WebView is open
  useEffect(() => {
    let pollInterval;
    
    if (showWebView && reference && !isPollingRef.current && !hasVerified) {
      isPollingRef.current = true;
      setIsPolling(true);
      pollInterval = setInterval(async () => {
        // Skip polling if already verified or verifying
        if (hasVerified || isVerifying) {
          console.log('🔄 Skipping poll - payment already verified or being verified');
          return;
        }

        try {
          console.log('🔄 Polling payment status for reference:', reference);
          const res = await axios.post(`${API_BASE_URL}/paystack/verify`, {
            reference: reference,
            userId: userData?._id
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📊 Poll response:', res.data);
          
          if (res.data.verified) {
            console.log('✅ Payment verified via polling!');
            setHasVerified(true);
            setShowWebView(false);
            isPollingRef.current = false;
            setIsPolling(false);
            clearInterval(pollInterval);
            
            const amountPaid = res.data.amount ? res.data.amount : parseInt(amount, 10);
            navigation.replace('PremiumScreen', { 
              amountAdded: amountPaid,
              fromPayment: true,
              reference: reference
            });
          }
        } catch (err) {
          console.log('⏳ Payment not yet verified, continuing to poll...');
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        isPollingRef.current = false;
        setIsPolling(false);
      }
    };
  }, [showWebView, reference, navigation, amount, userData, token, hasVerified, isVerifying]);

  const formatNumber = num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const handleAmountChange = v => {
    const numeric = v.replace(/[^0-9]/g, '');
    setAmount(numeric);
    setDisplayAmount(numeric ? formatNumber(numeric) : '');
  };

  const handleAmountPress = v => {
    setAmount(v);
    setDisplayAmount(formatNumber(v));
  };
  

const handleContinue = async () => {
  if (!amount) return;
  if (!userData) {
    Alert.alert('Error', 'User data not loaded. Please try again.');
    return;
  }

  // Reset verification state for new payment
  resetVerificationState();

  const amountInKobo = parseInt(amount, 10) * 100;
  try {
    const res = await axios.post(`${API_BASE_URL}/paystack/init`, {
      email: userData.email || 'user@example.com', // Use actual user email
      amount: amountInKobo,
      userId: userData._id // Include user ID
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const url = res.data.authorization_url;
    const ref = res.data.reference;

    console.log('💰 Payment initialized:', { url, ref });

    setReference(ref);
    setPaymentUrl(url);
    setShowWebView(true);
  } catch (err) {
    console.error('Payment init error:', err.response?.data || err.message);
    Alert.alert('Error', 'Payment initialization failed.');
  }
};

   

  const handleWebViewNav = nav => {
    if (!nav.url) return;
    
    console.log('WebView navigation:', nav.url);
    console.log('Reference available:', reference);
    
    // Check for both success and cancel URLs
    if (nav.url.includes('qiimeet://payment/success')) { 
      console.log('✅ Success callback detected!');
      setShowWebView(false);
      verifyPayment('webview');
    } else if (nav.url.includes('qiimeet://payment/cancel')) {
      console.log('❌ Payment cancelled callback detected');
      setShowWebView(false);
      Alert.alert('Payment Cancelled', 'Payment was cancelled.');
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader onBack={() => navigation.goBack()} title="Fund Wallet" />
      <View style={styles.content}>
        <Text style={styles.title}>
          Top up your wallet to initiate a connection with someone special...
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={[styles.input, amount ? styles.activeInput : styles.placeholderInput]}
            value={displayAmount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholder="Enter Amount"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amountScroll}>
          <View style={styles.amountGrid}>
            {amounts.map(a => (
              <TouchableOpacity
                key={a.value}
                style={[styles.amountButton, amount === a.value && styles.selectedAmount]}
                onPress={() => handleAmountPress(a.value)}
              >
                <Text style={[styles.amountText, amount === a.value && styles.selectedAmountText]}>
                  {a.display}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.continueButton, !amount && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!amount}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showWebView} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowWebView(false)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        {paymentUrl && (
          <WebView 
            source={{ uri: paymentUrl }} 
            onNavigationStateChange={handleWebViewNav}
            onShouldStartLoadWithRequest={(request) => {
              console.log('🔗 WebView request:', request.url); // Log all WebView requests
              
              // Handle deep links
              if (request.url.startsWith('qiimeet://')) {
                console.log('🎯 Deep link detected, opening with Linking:', request.url);
                Linking.openURL(request.url);
                return false; // Don't load in WebView
              }
              return true; // Load in WebView
            }}
            style={{ flex: 1 }}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 32 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 90, paddingHorizontal: 24, height: 56, marginBottom: 24 },
  currencySymbol: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginRight: 8, fontFamily: FONTS.medium },
  input: { flex: 1, fontSize: 16, fontFamily: FONTS.medium, height: '100%' },
  placeholderInput: { color: 'rgba(255,255,255,0.5)' },
  activeInput: { color: '#fff' },
  amountScroll: { marginBottom: 24 },
  amountGrid: { flexDirection: 'row', paddingHorizontal: 12, gap: 12 },
  amountButton: { backgroundColor: '#1a1a1a', paddingVertical: 12, height: 42, paddingHorizontal: 20, borderRadius: 90 },
  selectedAmount: { backgroundColor: 'rgba(236,6,106,0.1)' },
  amountText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: FONTS.medium },
  selectedAmountText: { color: '#ec066a' },
  continueButton: { backgroundColor: '#ec066a', paddingVertical: 16, borderRadius: 90,
     alignItems: 'center', position: 'absolute', bottom: 56, alignSelf: 'center', width: '100%' },
  disabledButton: { opacity: 0.5 },
  continueButtonText: { color: '#fff', fontSize:  24, fontFamily: FONTS.medium, fontWeight: '700' },
  modalHeader: { backgroundColor: '#121212', paddingTop: 50 },
  modalClose: { alignItems: 'flex-end', padding: 16 },
  modalCloseText: { color: '#fff', fontSize: 24, fontWeight: '700' },
});

export default FundWallet;