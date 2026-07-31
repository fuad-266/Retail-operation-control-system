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
} from 'react-native'
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
  const { orderId } = route.params
  
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [paymentReference, setPaymentReference] = useState('')

  // Fetch order details
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
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library')
      return
    }

    // Launch image picker
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
    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera')
      return
    }

    // Launch camera
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

    // Convert image URI to file
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
        <ActivityIndicator size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.backButton}>← Orders</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order #{orderId.slice(0, 8)}</Text>
          <Text style={styles.totalAmount}>
            Total: KES {order?.totalAmount.toLocaleString()}
          </Text>
        </View>

        {/* Payment Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Instructions</Text>
          <View style={styles.infoBox}>
            <Text style={styles.instructionTitle}>M-PESA (Mobile Money)</Text>
            <Text style={styles.instructionText}>
              1. Go to M-PESA menu on your phone
            </Text>
            <Text style={styles.instructionText}>
              2. Select "Lipa na M-PESA" → "Paybill"
            </Text>
            <Text style={styles.instructionText}>
              3. Enter Business Number: <Text style={styles.bold}>123456</Text>
            </Text>
            <Text style={styles.instructionText}>
              4. Enter Account Number: <Text style={styles.bold}>{orderId.slice(0, 8)}</Text>
            </Text>
            <Text style={styles.instructionText}>
              5. Enter Amount: <Text style={styles.bold}>KES {order?.totalAmount.toLocaleString()}</Text>
            </Text>
            <Text style={styles.instructionText}>
              6. Enter your M-PESA PIN and confirm
            </Text>
          </View>

          <View style={[styles.infoBox, { marginTop: 12 }]}>
            <Text style={styles.instructionTitle}>Bank Transfer</Text>
            <Text style={styles.instructionText}>
              Bank: <Text style={styles.bold}>Kenya Commercial Bank</Text>
            </Text>
            <Text style={styles.instructionText}>
              Account Name: <Text style={styles.bold}>Retail Shop Ltd</Text>
            </Text>
            <Text style={styles.instructionText}>
              Account Number: <Text style={styles.bold}>1234567890</Text>
            </Text>
          </View>
        </View>

        {/* Upload Screenshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Payment Screenshot</Text>
          
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadIcon}>🖼️</Text>
                <Text style={styles.uploadText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.helperText}>
            Upload a clear screenshot of your payment confirmation
          </Text>
        </View>

        {/* Payment Reference (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Reference (Optional)</Text>
          <TextInput
            style={styles.referenceInput}
            placeholder="e.g., M-PESA reference code"
            value={paymentReference}
            onChangeText={setPaymentReference}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!imageUri || uploadPaymentMutation.isPending) && styles.buttonDisabled,
          ]}
          onPress={handleSubmitPayment}
          disabled={!imageUri || uploadPaymentMutation.isPending}
        >
          {uploadPaymentMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeImageText: {
    color: '#007AFF',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  referenceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})