import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Image, Modal } from 'react-native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';
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
  const [showCamera, setShowCamera] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const loadCamera = async () => {
      try {
        const cameraModule = await import('expo-camera');
        let CameraComp = null;
        let permissionsHook = null;
        let modern = false;

        // Check for modern CameraView first
        if (cameraModule.CameraView) {
          CameraComp = cameraModule.CameraView;
          permissionsHook = cameraModule.useCameraPermissions;
          modern = true;
        } else if (cameraModule.Camera) {
          CameraComp = cameraModule.Camera;
          modern = false;
        } else if (cameraModule.default) {
          CameraComp = cameraModule.default;
          modern = false;
        }

        if (!CameraComp) {
          setCameraError('No valid camera component found');
          setPermission(false);
          return;
        }

        setCameraComponent(() => CameraComp);
        setUseCameraPermissions(() => permissionsHook);
        setIsModernCamera(modern);

        // Handle permissions
        if (permissionsHook) {
          setPermission('hook');
        } else {
          let status;
          if (cameraModule.Camera?.requestCameraPermissionsAsync) {
            const result = await cameraModule.Camera.requestCameraPermissionsAsync();
            status = result.status;
          } else if (cameraModule.requestCameraPermissionsAsync) {
            const result = await cameraModule.requestCameraPermissionsAsync();
            status = result.status;
          }
          setPermission(status === 'granted');
        }
      } catch (error) {
        setCameraError(`Failed to load camera: ${error.message}`);
        setPermission(false);
      }
    };
    loadCamera();
  }, []);

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
      // For modern CameraView
      return {
        facing: 'front' // Use 'facing' prop for CameraView
      };
    } else {
      // For legacy Camera component
      return {
        type: 'front' // Try direct string first
      };
    }
  };

  const getStepInstruction = () => 'Look straight at the camera';

  const handleCapture = async () => {
    if (!cameraReady || !cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: false,
    });
    setCapturedPhoto(photo);
    setShowSuccessModal(true);
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
                onCameraReady={() => setCameraReady(true)}
              />
            ) : (
              <Image 
                source={require('../../assets/smiler.jpg')} 
                style={styles.camera}
                resizeMode="cover"
              />
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
          style={styles.startButton}
          onPress={() => {
            if (!showCamera) {
              setShowCamera(true);
              return;
            }
            handleCapture();
          }}
        >
          <Text style={styles.startButtonText}>
            {!showCamera ? 'Start' : 'Capture'}
          </Text>
        </TouchableOpacity>
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
});

export default CameraVerification;