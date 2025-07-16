import { StyleSheet, Platform, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  nextButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(51,51,51,0.5)', // changed to have opacity
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dobInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    color: '#FFF',
    fontSize: 16,
    width: Platform.OS === 'ios' ? 70 : 60,
    textAlign: 'center',
  },
  dobSeparator: {
    fontSize: 24,
    color: '#666',
    marginHorizontal: 10,
  },
  optionsContainer: {
    marginVertical: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  lifestyleCategory: {
    marginBottom: 20,
  },
  lifestyleCategoryTitle: {
    color: '#AAA',
    fontSize: 16,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  photoUploadBox: {
    width: width * 0.28,
    height: height * 0.16, 
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center', 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)', // changed to have opacity
    opacity: 0.8,
    borderStyle: 'dashed',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeIconButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 16,
    height: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  locationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 56, 92, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  locationText: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 30,
  },
  allowButton: {
    backgroundColor: '#ff385c',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  allowButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollViewContainer: {
    flex: 1,
  },
  optionItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginVertical: 6,
  },
  optionItemSelected: {
    backgroundColor: '#FF3D7F',
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default styles;