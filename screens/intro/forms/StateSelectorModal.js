import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT (Abuja)'
];

const { height } = Dimensions.get('window');

const StateSelectorModal = ({ visible, onSelect, onCancel }) => {
  const [selectedState, setSelectedState] = useState(null);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Your State of Residence</Text>
          <FlatList
            data={NIGERIA_STATES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.stateItem,
                  selectedState === item && styles.selectedStateItem
                ]}
                onPress={() => setSelectedState(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.stateText}>{item}</Text>
                <View style={[styles.radioButton, selectedState === item && styles.radioButtonSelected]}>
                  {selectedState === item && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>
            )}
            style={{ maxHeight: height * 0.5 }}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedState && { opacity: 0.5 }]}
              onPress={() => selectedState && onSelect(selectedState)}
              disabled={!selectedState}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    maxHeight: height * 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
    marginBottom: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 220,
    alignSelf: 'center',
  },
  selectedStateItem: {
    borderColor: '#EC066A',
    borderWidth: 2,
  },
  stateText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'left',
    flex: 1,
  },
  radioButton: {
    height: 18,
    width: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: '#EC066A',
  },
  radioButtonInner: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#EC066A',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#232323',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#EC066A',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StateSelectorModal; 