import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const statusStyles = {
  Active: {
    bg: 'rgba(46,204,64,0.15)',
    color: '#2ecc40',
  },
  Expired: {
    bg: 'rgba(136,136,136,0.15)',
    color: '#888',
  },
  Failed: {
    bg: 'rgba(255,59,48,0.15)',
    color: '#ff3b30',
  },
};

const HistoryDetailScreen = ({ navigation, route }) => {
  // Get data from navigation params
  const {
    status = 'Active',
    amount = '₦1,500', 
    dateInitiated = 'April 5, 2025',
    expiryDate = 'May 5, 2025',
    period = '/month',
  } = route.params || {};

  const statusKey = status === 'Successful' ? 'Active' : status; // Map 'Successful' to 'Active'
  const statusStyle = statusStyles[statusKey] || statusStyles.Active;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {statusKey}
            </Text>
          </View>
          <Text style={styles.planText}>Premium Plan Subscription</Text>
          <Text style={styles.amountText}>{amount}{period}</Text>
        </View>

        <Text style={styles.sectionTitle}>Subscription Dates</Text>
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Date Initiated</Text>
          <Text style={styles.dateValue}>{dateInitiated}</Text>
        </View>
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Expiry Date</Text>
          <Text style={styles.dateValue}>{statusKey === 'Failed' ? '-' : expiryDate}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.resubscribeButton}
        onPress={() => navigation.navigate('ReSubscribeScreen')}
      >
        <Text style={styles.resubscribeButtonText}>Re-Subscribe</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16, 
    justifyContent: 'space-between',
  },
  headerLeft: {
    padding: 4,
    paddingRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    flex: 1, 
    marginLeft: 8,
  },
  contentContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },
  planText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginVertical: 8,
  },
  amountText: {
    color: '#fff',
    fontSize: 16,  
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    marginVertical: 16,
  },
  dateCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  dateLabel: {
    color: '#fff',
    fontSize: 16,  
    marginBottom: 2,
  },
  dateValue: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  resubscribeButton: {
    borderWidth: 1,
    borderColor: '#ec066a',
    borderRadius: 90,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 56,
    marginTop: 8,
  },
  resubscribeButtonText: {
    color: '#ec066a',
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '700',
  },
});

export default HistoryDetailScreen;
