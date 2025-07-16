import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const historyData = [
  {
    id: '1',
    status: 'Successful',
    statusColor: '#6ec531',
    amount: '₦1,500',
    plan: 'Premium Plan',
    date: 'April 5, 2025',
  },
  {
    id: '2',
    status: 'Failed',
    statusColor: '#DC3545',
    amount: '₦1,500',
    plan: 'Premium Plan',
    date: 'April 5, 2025',
  },
  {
    id: '3',
    status: 'Successful',
    statusColor: '#6ec531',
    amount: '₦1,500',
    plan: 'Premium Plan',
    date: 'March 5, 2025',
  },
  {
    id: '4',
    status: 'Successful',
    statusColor: '#6ec531',
    amount: '₦2,500',
    plan: 'Premium Plan',
    date: 'February 5, 2025',
  },
  {
    id: '5',
    status: 'Expired',
    statusColor: '#9ca3af',
    amount: '₦2,500',
    plan: 'Premium Plan',
    date: 'January 5, 2025',
  },
];

const ViewHistoryScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('HistoryDetailScreen', {
      status: item.status === 'Successful' ? 'Active' : item.status,
      amount: item.amount,
      plan: item.plan,
      dateInitiated: item.date,
      expiryDate: item.status === 'Failed' ? '-' : 'May 5, 2025',
      period: '/month',
    })}>
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { 
            backgroundColor: 
              item.status === 'Successful'
                ? 'rgba(110,197,49,0.2)'
                : item.status === 'Failed'
                  ? 'rgba(220,53,69,0.2)'
                  : item.status === 'Expired'
                    ? 'rgba(156,163,175,0.2)'
                    : 'rgba(255,59,48,0.2)'
          }]}>
            <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.amountText}>{item.amount} <Text style={styles.planText}>- {item.plan}</Text></Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View History</Text>
        <TouchableOpacity style={styles.headerRight}>
          <MaterialCommunityIcons name="filter-variant" size={42} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={historyData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  headerRight: {
    padding: 4,
    paddingLeft: 8,
  },
  listContent: {
    paddingHorizontal:24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },
  amountText: {
    color: '#fff',
    fontSize: 24, 
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  planText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 24,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});

export default ViewHistoryScreen;
