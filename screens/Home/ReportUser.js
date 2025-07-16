import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const reasons = [
  'Offensive or inappropriate content',
  'Harassment or threats',
  'Fake profile',
  'Scam or commercial',
  'Underaged',
  'Off Qiimeet behavior',
  "I'm just not interested",
  'Others',
];

const ReportUser = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopHeader title="Report" onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>
        Please select a reason for reporting this user
      </Text>
      <ScrollView contentContainerStyle={styles.reasonsList}>
        {reasons.map((reason, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.reasonBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ReportDetails', { reason })}
          >
            <Text style={styles.reasonText}>{reason}</Text>
            <Image
              source={require('../../assets/right.png')}
              style={{ width: 8, height: 16}}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 0,
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginLeft: 20,
    marginBottom: 10,
  },
  reasonsList: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  reasonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  arrow: {
    color: '#fff', 
    opacity: 0.5,
    fontSize: 40,
    fontWeight: '400',
  },
});

export default ReportUser;
