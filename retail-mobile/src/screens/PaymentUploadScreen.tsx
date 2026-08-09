import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import * as ImagePicker from 'expo-image-picker'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RootStackParamList } from '../navigation/AppStack'
import { ordersService } from '../services/orders.service'

type PaymentUploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentUpload'>
type PaymentUploadScreenRouteProp = {
  key: string
  name: 'PaymentUpload'
  params: { orderId: string }
}

export default function PaymentUploadScreen() {
  const navigation = useNavigation<PaymentUploadScreenNavigationProp>()
  const route = useRoute<PaymentUploadScreenRouteProp>()
  const insets = useSafeAreaInsets()
  const { orderId } = route.params

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [paymentReference, setPaymentReference] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getOrder(orderId),
  })

  const uploadPaymentMutation = useMutation({
    mutationFn: ({ screenshot, reference }: { screenshot: any; reference?: string }) =>
      ordersService.submitPayment(orderId, screenshot, reference),
    onSuccess: () => {
      Alert.alert(
        'Payment Submitted!',
        'Your payment screenshot has been submitted successfully. We will verify and process your order soon.',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      )
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload payment screenshot')
    },
  })

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleSubmitPayment = async () => {
    if (!imageUri) {
      Alert.alert('Missing Screenshot', 'Please upload a payment screenshot')
      return
    }

    const filename = imageUri.split('/').pop() || 'payment.jpg'
    const match = /\.(\w+)$/.exec(filename)
    const type = match ? `image/${match[1]}` : 'image/jpeg'

    const screenshot = {
      uri: imageUri,
      name: filename,
      type,
    }

    uploadPaymentMutation.mutate({
      screenshot,
      reference: paymentReference.trim() || undefined,
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8601C" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Order Info Card */}
        <View style={styles.orderInfoCard}>
          <View style={styles.orderInfoIcon}>
            <Text style={{ fontSize: 24 }}>💰</Text>
          </View>
          <Text style={styles.orderInfoId}>Order #{orderId.slice(0, 8)}</Text>
          <Text style={styles.orderInfoTotal}>
            KES {order?.totalAmount.toLocaleString()}
          </Text>
          <Text style={styles.orderInfoLabel}>Amount to Pay</Text>
        </View>

        {/* M-PESA Instructions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📱</Text>
            <Text style={styles.cardTitle}>M-PESA (Mobile Money)</Text>
          </View>
          <View style={styles.instructionsList}>
            {[
              'Go to M-PESA menu on your phone',
              'Select "Lipa na M-PESA" → "Paybill"',
              { text: 'Business Number: ', bold: '123456' },
              { text: 'Account Number: ', bold: orderId.slice(0, 8) },
              { text: 'Amount: ', bold: `KES ${order?.totalAmount.toLocaleString()}` },
              'Enter your M-PESA PIN and confirm',
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                {typeof step === 'string' ? (
                  <Text style={styles.stepText}>{step}</Text>
                ) : (
                  <Text style={styles.stepText}>
                    {step.text}<Text style={styles.stepBold}>{step.bold}</Text>
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bank Transfer */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏦</Text>
            <Text style={styles.cardTitle}>Bank Transfer</Text>
          </View>
          <View style={styles.bankDetails}>
            {[
              { label: 'Bank', value: 'Kenya Commercial Bank' },
              { label: 'Account Name', value: 'Retail Shop Ltd' },
              { label: 'Account Number', value: '1234567890' },
            ].map((detail, i) => (
              <View key={i} style={styles.bankRow}>
                <Text style={styles.bankLabel}>{detail.label}</Text>
                <Text style={styles.bankValue}>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upload Screenshot Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📸</Text>
            <Text style={styles.cardTitle}>Upload Payment Screenshot</Text>
          </View>

          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.changeImageText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto} activeOpacity={0.85}>
                <View style={styles.uploadIconCircle}>
                  <Text style={styles.uploadIcon}>📷</Text>
                </View>
                <Text style={styles.uploadText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={pickImage} activeOpacity={0.85}>
                <View style={styles.uploadIconCircle}>
                  <Text style={styles.uploadIcon}>🖼️</Text>
                </View>
                <Text style={styles.uploadText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.helperText}>
            Upload a clear screenshot of your payment confirmation
          </Text>
        </View>

        {/* Payment Reference */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔖</Text>
            <Text style={styles.cardTitle}>Payment Reference</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          </View>
          <TextInput
            style={styles.referenceInput}
            placeholder="e.g., M-PESA reference code"
            placeholderTextColor="#BBB"
            value={paymentReference}
            onChangeText={setPaymentReference}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(28, insets.bottom + 16) }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!imageUri || uploadPaymentMutation.isPending) && styles.buttonDisabled,
          ]}
          onPress={handleSubmitPayment}
          disabled={!imageUri || uploadPaymentMutation.isPending}
          activeOpacity={0.85}
        >
          {uploadPaymentMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.submitIcon}>📤</Text>
              <Text style={styles.submitButtonText}>Submit Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 18,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Order Info Card
  orderInfoCard: {
    backgroundColor: '#E8601C',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  orderInfoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfoId: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 6,
  },
  orderInfoTotal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  orderInfoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },

  // Instructions
  instructionsList: {
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E8601C',
  },
  stepText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  stepBold: {
    fontWeight: '700',
    color: '#E8601C',
  },

  // Bank details
  bankDetails: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankLabel: {
    fontSize: 13,
    color: '#999',
  },
  bankValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Upload
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#FFF0EB',
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0D3',
    borderStyle: 'dashed',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8601C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadIcon: {
    fontSize: 20,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E8601C',
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    marginBottom: 10,
  },
  changeImageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
  },
  changeImageText: {
    color: '#EF5350',
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  // Reference
  optionalBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  optionalText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  referenceInput: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#333',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  submitButton: {
    backgroundColor: '#E8601C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#E8601C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitIcon: {
    fontSize: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
})