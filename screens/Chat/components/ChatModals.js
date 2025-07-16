import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Call Modal
export function CallModal({ visible, onClose, onVoiceCallPress, onVideoCallPress, styles }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.callModal}>
          <TouchableOpacity style={styles.callModalItem} onPress={onVoiceCallPress}>
            <MaterialIcons name="phone" size={20} color="rgba(255,255,255,0.5)" style={{ marginRight: 14 }} />
            <Text style={styles.callModalText}>Voice Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callModalItem} onPress={onVideoCallPress}>
            <Ionicons name="videocam" size={20} color="rgba(255,255,255,0.5)" style={{ marginRight: 14 }} />
            <Text style={styles.callModalText}>Video Call</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Plus Modal
export function PlusModal({ visible, onClose, onGallerySelect, onAudioSelect, styles }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.plusModal}>
          <TouchableOpacity style={styles.plusModalItem} onPress={onGallerySelect}>
            <Ionicons name="image" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
            <Text style={styles.plusModalText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusModalItem} onPress={onAudioSelect}>
            <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
            <Text style={styles.plusModalText}>Audio</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Dropdown Menu
export function DropdownMenu({ visible, onClose, onViewProfilePress, onCancelConnectionPress, onBlockPress, onReportPress, styles }) {
  if (!visible) return null;
  return (
    <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.dropdownMenu}>
        <TouchableOpacity style={styles.menuItem} onPress={onViewProfilePress}>
          <Ionicons name="person" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onCancelConnectionPress}>
          <MaterialCommunityIcons name="account-remove" size={22} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
          <Text style={styles.menuText}>Cancel Connection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onBlockPress}>
          <MaterialCommunityIcons name="account-cancel" size={24} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
          <Text style={styles.menuText}>Block</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onReportPress}>
          <Ionicons name="alert-circle" size={22} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>Report</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
