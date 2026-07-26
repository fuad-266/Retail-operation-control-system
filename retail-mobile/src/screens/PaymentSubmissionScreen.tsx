import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function PaymentSubmissionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Payment Submission Screen</Text>
      <Text style={styles.subText}>Coming soon...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
})