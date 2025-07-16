import React from 'react';
import { Modal, TouchableOpacity, View, Text, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Call Modal
export function CallModal({ visible, onClose, onVoiceCall, onVideoCall, styles }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.callModal}>
          <TouchableOpacity style={styles.callModalItem} onPress={onVoiceCall}>
            <MaterialIcons name="phone" size={20} color="rgba(255,255,255,0.5)" style={{ marginRight: 14 }} />
            <Text style={styles.callModalText}>Voice Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callModalItem} onPress={onVideoCall}>
            <Ionicons name="videocam" size={20} color="rgba(255,255,255,0.5)" style={{ marginRight: 14 }} />
            <Text style={styles.callModalText}>Video Call</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Plus Modal
export function PlusModal({ visible, onClose, onGallery, onAudio, styles }) {
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
          <TouchableOpacity style={styles.plusModalItem} onPress={onGallery}>
            <Ionicons name="image" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
            <Text style={styles.plusModalText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusModalItem} onPress={onAudio}>
            <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
            <Text style={styles.plusModalText}>Audio</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Emoji Picker Modal (as a View, not Modal)
export function EmojiPicker({ visible, categories, selectedCategory, onSelectCategory, onSelectEmoji, styles }) {
  if (!visible) return null;
  return (
    <View style={styles.emojiPicker}>
      <View style={styles.emojiCategories}>
        {Object.keys(categories).map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.emojiCategoryTab, selectedCategory === category && styles.emojiCategoryTabActive]}
            onPress={() => onSelectCategory(category)}
          >
            <Text style={[styles.emojiCategoryText, selectedCategory === category && styles.emojiCategoryTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.emojiGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.emojiContainer}>
          {categories[selectedCategory].map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiButton}
              onPress={() => onSelectEmoji(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
} 