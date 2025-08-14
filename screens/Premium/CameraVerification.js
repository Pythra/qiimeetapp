import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Image, Modal } from 'react-native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import greenWhiteCheck from '../../assets/greenwhitecheck.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CIRCLE_SIZE = 250;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;

const CameraVerification = ({ navigation }) => {
  const [permission, setPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [CameraComponent, setCameraComponent] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [useCameraPermissions, setUseCameraPermissions] = useState(null);
  const [isModernCamera, setIsModernCamera] = useState(false);
  const [showCamera, setShowCamera] = useState(true); // Start camera immediately
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraTimeout, setCameraTimeout] = useState(false);
  const [showFallbackButton, setShowFallbackButton] = useState(false);
  const cameraRef = useRef(null);
  const cameraTimeoutRef = useRef(null);

  useEffect(() => {
    const loadCamera = async () => {
      try {
        console.log('Loading camera module...');
        const cameraModule = await import('expo-camera');
        console.log('Camera module loaded:', Object.keys(cameraModule));
        
        let CameraComp = null;
        let permissionsHook = null;
        let modern = false;

        // Check for modern CameraView first (expo-camera v15+)
        if (cameraModule.CameraView) {
          console.log('Using modern CameraView');
          CameraComp = cameraModule.CameraView;
          permissionsHook = cameraModule.useCameraPermissions;
          modern = true;
        } else if (cameraModule.Camera) {
          console.log('Using legacy Camera component');
          CameraComp = cameraModule.Camera;
          modern = false;
        } else if (cameraModule.default) {
          console.log('Using default Camera component');
          CameraComp = cameraModule.default;
          modern = false;
        }

        if (!CameraComp) {
          console.error('No camera component found in module');
          setCameraError('No valid camera component found. Please ensure expo-camera is properly installed.');
          setPermission(false);
          return;
        }

        setCameraComponent(() => CameraComp);
        setUseCameraPermissions(() => permissionsHook);
        setIsModernCamera(modern);
        
        console.log('Camera component set:', { modern, hasPermissionsHook: !!permissionsHook });

        // Handle permissions
        if (permissionsHook) {
          console.log('Using modern permissions hook');
          setPermission('hook');
        } else {
          console.log('Using legacy permissions method');
          let status;
          if (cameraModule.Camera?.requestCameraPermissionsAsync) {
            console.log('Requesting camera permissions via Camera.requestCameraPermissionsAsync');
            const result = await cameraModule.Camera.requestCameraPermissionsAsync();
            status = result.status;
          } else if (cameraModule.requestCameraPermissionsAsync) {
            console.log('Requesting camera permissions via module.requestCameraPermissionsAsync');
            const result = await cameraModule.requestCameraPermissionsAsync();
            status = result.status;
          } else {
            console.warn('No permission request method found, assuming granted');
            status = 'granted';
          }
          console.log('Permission status:', status);
          setPermission(status === 'granted');
        }
      } catch (error) {
        console.error('Failed to load camera:', error);
        setCameraError(`Failed to load camera: ${error.message}. Please ensure expo-camera is installed.`);
        setPermission(false);
      }
    };
    loadCamera();
  }, []);

  // Add camera ready timeout
  useEffect(() => {
    if (showCamera && CameraComponent && !cameraReady) {
      cameraTimeoutRef.current = setTimeout(() => {
        console.warn('Camera ready timeout - forcing ready state');
        setCameraReady(true);
        setCameraTimeout(true);
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (cameraTimeoutRef.current) {
        clearTimeout(cameraTimeoutRef.current);
        cameraTimeoutRef.current = null;
      }
    };
  }, [showCamera, CameraComponent, cameraReady]);

  const ModernCameraComponent = () => {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    useEffect(() => {
      if (cameraPermission === null) requestCameraPermission();
    }, [cameraPermission]);

    if (cameraPermission === null)
      return <PermissionMessage text="Requesting camera permission..." />;

    if (!cameraPermission.granted)
      return <PermissionMessage text="No access to camera" />;

    return <CameraViewContainer />;
  };

  const LegacyCameraComponent = () => {
    if (permission === null) return <PermissionMessage text="Requesting camera permission..." />;
    if (permission === false) return <PermissionMessage text="No access to camera" />;

    return <CameraViewContainer />;
  };

  const PermissionMessage = ({ text }) => (
    <View style={styles.container}>
      <TopHeader onBack={() => navigation.goBack()} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );

  const getCameraProps = () => {
    if (isModernCamera) {
      // For modern CameraView (expo-camera v15+)
      console.log('Setting up modern camera props');
      return {
        facing: 'front',
        // Remove mode prop as it might not be needed for CameraView
      };
    } else {
      // For legacy Camera component
      console.log('Setting up legacy camera props');
      const { Camera } = require('expo-camera');
      return {
        type: Camera?.Constants?.Type?.front || 'front'
      };
    }
  };

  const getStepInstruction = () => 'Look straight at the camera';

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    // Allow capture even if camera not "ready" after timeout
    if (!cameraReady && !cameraTimeout) return;
    
    try {
      setIsCapturing(true);
      console.log('Starting photo capture...', { cameraReady, cameraTimeout, isModernCamera });
      
      let photo;
      
      if (isModernCamera) {
        // Modern CameraView (expo-camera v15+)
        console.log('Using modern camera capture');
        console.log('Available methods:', Object.getOwnPropertyNames(cameraRef.current));
        
        if (cameraRef.current.takePictureAsync) {
          console.log('Using takePictureAsync method');
          // Modern CameraView expects simpler options
          photo = await cameraRef.current.takePictureAsync();
        } else {
          throw new Error('takePictureAsync method not available on modern CameraView');
        }
      } else {
        // Legacy Camera component
        console.log('Using legacy camera capture');
        if (!cameraRef.current.takePictureAsync) {
          throw new Error('takePictureAsync method not available on legacy camera reference');
        }
        
        photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
          skipProcessing: false,
        });
      }
      
      console.log('Photo captured:', photo);
      
      if (photo && photo.uri) {
        setCapturedPhoto(photo);
        await AsyncStorage.setItem('capturedSelfie', photo.uri);
        console.log('Photo saved to AsyncStorage:', photo.uri);
        setShowSuccessModal(true);
      } else {
        console.error('Invalid photo object:', photo);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cameraRef: !!cameraRef.current,
        takePictureAsync: !!cameraRef.current?.takePictureAsync
      });
      
      // Try fallback with ImagePicker
      console.log('Attempting fallback with ImagePicker...');
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          cameraType: ImagePicker.CameraType.front,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const photo = { uri: result.assets[0].uri };
          console.log('Fallback photo captured:', photo);
          
          setCapturedPhoto(photo);
          await AsyncStorage.setItem('capturedSelfie', photo.uri);
          console.log('Fallback photo saved to AsyncStorage:', photo.uri);
          setShowSuccessModal(true);
          return; // Success with fallback
        }
      } catch (fallbackError) {
        console.error('Fallback ImagePicker also failed:', fallbackError);
      }
      
      // Show fallback button if both automated methods failed
      setShowFallbackButton(true);
      
      // Show error if both methods failed
      let errorMessage = 'Failed to capture photo. Please try again.';
      if (error.message.includes('permissions') || error.message.includes('Permission')) {
        errorMessage = 'Camera permission denied. Please enable camera access in settings.';
      } else if (error.message.includes('not ready') || error.message.includes('not available')) {
        errorMessage = 'Camera is not ready. Please wait a moment and try again.';
      } else if (error.message.includes('takePictureAsync')) {
        errorMessage = 'Camera method not available. Please restart the app and try again.';
      } else if (error.message.includes('Camera is not running')) {
        errorMessage = 'Camera is not active. Please restart the screen and try again.';
      }
      
      Alert.alert('Camera Error', `${errorMessage}\n\nA manual camera option will appear below.`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleManualCapture = async () => {
    try {
      setIsCapturing(true);
      console.log('Manual camera capture initiated...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = { uri: result.assets[0].uri };
        console.log('Manual photo captured:', photo);
        
        setCapturedPhoto(photo);
        await AsyncStorage.setItem('capturedSelfie', photo.uri);
        console.log('Manual photo saved to AsyncStorage:', photo.uri);
        setShowSuccessModal(true);
        setShowFallbackButton(false); // Hide fallback button on success
      }
    } catch (error) {
      console.error('Manual capture failed:', error);
      Alert.alert('Manual Capture Failed', 'Unable to open camera. Please check your permissions and try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const SuccessModal = () => (
    <Modal
      transparent
      visible={showSuccessModal}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Image 
            source={greenWhiteCheck}
            style={{
              width: 104,
              height: 104
            }}
            resizeMode="contain"
          />
          <Text style={styles.modalTitle}>Photo Verification Successful!</Text> 
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => {
              setShowSuccessModal(false);
              navigation.navigate('IdentityVerification');
            }}
          >
            <Text style={styles.modalButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const CameraViewContainer = () => (
    <View style={styles.container}>
      <TopHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>{getStepInstruction()}</Text>
      <View style={styles.content}>
        <View style={styles.camcontent}>
          <View style={styles.cameraWrapper}>
            {showCamera ? (
              <CameraComponent
                ref={cameraRef}
                style={styles.camera}
                {...getCameraProps()}
                onCameraReady={() => {
                  console.log('Camera is ready');
                  setCameraReady(true);
                  if (cameraTimeoutRef.current) {
                    clearTimeout(cameraTimeoutRef.current);
                    cameraTimeoutRef.current = null;
                  }
                }}
                onMountError={(error) => {
                  console.error('Camera mount error:', error);
                  setCameraError(`Camera mount failed: ${error?.message || 'Unknown error'}`);
                }}
              />
            ) : (
              <View style={[styles.camera, styles.cameraPlaceholder]}>
                <Text style={styles.cameraPlaceholderText}>Camera Loading...</Text>
              </View>
            )}
          </View>
          <Text style={styles.instructionText}>
            Position your face in the circle
          </Text>
        </View>
        <View style={styles.instructionContainer}> 
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#888" style={styles.infoIcon} />
            <Text style={styles.subText}>
              Make sure you're in a place where there is enough light to take a clear photo.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.startButton, (isCapturing || (!cameraReady && !cameraTimeout)) && styles.startButtonDisabled]}
          onPress={handleCapture}
          disabled={(!cameraReady && !cameraTimeout) || isCapturing}
        >
          <Text style={styles.startButtonText}>
            {isCapturing ? 'Capturing...' : 
             !cameraReady ? (cameraTimeout ? 'Camera Ready (Timeout)' : 'Camera Loading...') : 
             'Capture Photo'}
          </Text>
        </TouchableOpacity>
        
        {showFallbackButton && (
          <TouchableOpacity
            style={[styles.fallbackButton]}
            onPress={handleManualCapture}
            disabled={isCapturing}
          >
            <Text style={styles.fallbackButtonText}>
              {isCapturing ? 'Opening Camera...' : 'Use Manual Camera'}
            </Text>
          </TouchableOpacity>
        )}
        
        <SuccessModal />
      </View>
    </View>
  );

  if (cameraError) {
    return (
      <View style={styles.container}>
        <TopHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera Error</Text>
          <Text style={styles.errorMessage}>{cameraError}</Text>
          <Text style={styles.errorSolution}>
            Try updating expo-camera:{'\n'}npx expo install expo-camera
          </Text>
        </View>
      </View>
    );
  }

  if (!CameraComponent) {
    return (
      <View style={styles.container}>
        <TopHeader onBack={() => navigation.goBack()} />
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  return permission === 'hook' ? <ModernCameraComponent /> : <LegacyCameraComponent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32, 
    
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40, 
  },
  camcontent: { 
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
  },
  cameraWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,  
    overflow: 'hidden',
    marginBottom: 24,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  instructionContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dotted',
    borderRadius: 8,
    width: '100%',
    padding: 16,  
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    marginRight: 16,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 8,
    width: '100%',
    maxWidth: 420, 
    marginTop:8, 
  },
  subText: {
    color: '#888',
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
  },
  startButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 90,
    position:'absolute',
    bottom: 56,
    width: '100%',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    fontWeight: '700',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 100,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '600',  
    paddingHorizontal: 32,  
    alignSelf: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#121212',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 20,
    fontFamily: FONTS.medium,
    marginBottom: 10,
  },
  errorMessage: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorSolution: {
    color: '#888',
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%', // Increased from 80%
    maxWidth: 500, // Added maxWidth for larger screens
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  }, 
  modalButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginVertical: 16,
    borderRadius: 90,
    height: 64,
    alignContent: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '700',
    textAlign: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  fallbackButton: {
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 90,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#666',
  },
  fallbackButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});

export default CameraVerification;