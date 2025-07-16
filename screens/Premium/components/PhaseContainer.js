import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../../constants/font';

const PhaseContainer = ({ currentPhase }) => {
  const phases = [
    { id: 1, title: 'Phase 1' },
    { id: 2, title: 'Phase 2' },
    { id: 3, title: 'Phase 3' }
  ];

  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={styles.progressLineBackground} />
        <View style={[styles.progressLineActive, { 
          width: currentPhase === 1 ? '0%' : currentPhase === 2 ? '50%' : '100%' 
        }]} />
        {phases.map((phase, index) => (
          <View 
            key={phase.id}
            style={[
              styles.progressDot,
              { left: `${(index / (phases.length - 1)) * 100}%` },
              phase.id <= currentPhase && styles.progressDotActive
            ]}
          >
            {phase.id <= currentPhase && <View style={styles.innerDot} />}
          </View>
        ))}
      </View>
      
      <View style={styles.progressLabelsContainer}>
        {phases.map((phase, index) => (
          <Text 
            key={phase.id}
            style={[
              styles.progressLabel,
              { left: `${(index / (phases.length - 1)) * 100}%` },
              phase.id <= currentPhase ? styles.progressLabelActive : styles.progressLabelInactive
            ]}
          >
            {phase.title}
          </Text>
        ))}
      </View>
    </View>
  );

  return <ProgressIndicator />;
};

const styles = StyleSheet.create({
  progressContainer: { 
    paddingHorizontal: 44,
    backgroundColor: '#1e1e1e',
    paddingTop: 24, 
    paddingBottom: 16,
    borderRadius: 8,
  },
  progressTrack: {
    position: 'relative',
    height: 2,
    marginTop: 10,
  },
  progressLineBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#fff',
  },
  progressLineActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: '#ec066a',
    zIndex: 1,
  },
  progressDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: -11,
    marginLeft: -12,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'white',
  },
  progressDotActive: {
    borderColor: '#ec066a',
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec066a',
  },

  progressLabelsContainer: {
    position: 'relative',
    height: 20,
    marginTop: 24,
  },
  progressLabel: {
    position: 'absolute',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: -20,
    textAlign: 'center',  
  },
  progressLabelActive: {
    color: '#ec066a',
    fontFamily: FONTS.medium,
  },
  progressLabelInactive: {
    color: 'white',
  },
});

export default PhaseContainer;