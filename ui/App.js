import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer,useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const StartStreamScreen = () => {
  const navigation = useNavigation(); // Access navigation

  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);

  const startStream = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.125:4000/start_stream', {
        method: 'POST',
      });
      const result = await response.json();

      if (response.ok) {
        setStreaming(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to start the stream');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const stopStream = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.125:4000/stop_stream', {
        method: 'POST',
      });
      const result = await response.json();

      if (response.ok) {
        setStreaming(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to stop the stream');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Streaming App</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
      ) : (
        <>
          <View style={styles.buttonContainer}>
            {!streaming ? (
              <TouchableOpacity style={styles.button} onPress={startStream}>
                <Text style={styles.buttonText}>Start Stream</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopStream}>
                <Text style={styles.buttonText}>Stop Stream</Text>
              </TouchableOpacity>
            )}
                       <TouchableOpacity
            style={[styles.button, { backgroundColor: '#2196f3' }]}
            onPress={() => navigation.navigate('AddPerson')}
          >
            <Text style={styles.buttonText}>Go to Add Person</Text>
          </TouchableOpacity>
          </View>
          {streaming && (
        <SafeAreaView style={styles.webViewContainer}>
              <WebView
                source={{ uri: 'http://192.168.1.125:4000/video_feed' }}
                style={styles.webview}
              />
      </SafeAreaView>
          )}

        </>
        
      )}
    </SafeAreaView>
  );
};

const AddPersonScreen = () => {
  const [label, setLabel] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddPerson = async () => {
    if (!label || !image) {
      Alert.alert('Error', 'Please provide both a label and an image.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('label', label);
      formData.append('image', {
        uri: image.uri,
        type: image.type,
        name: image.fileName || 'photo.jpg',
      });

      const response = await fetch('http://192.168.1.125:4000/add_face', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Person added successfully!');
        setLabel('');
        setImage(null);
      } else {
        Alert.alert('Error', result.message || 'Failed to add the person');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
    }
  };

  const openImageLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } else {
      Alert.alert('Permission Denied', 'Gallery permission is required to pick an image.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Add Person</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter label"
            value={label}
            onChangeText={setLabel}
          />
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity style={styles.imagePickerButton} onPress={openCamera}>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerButton} onPress={openImageLibrary}>
              <Text style={styles.buttonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={styles.previewImage}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={handleAddPerson}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="StartStream" component={StartStreamScreen} />
        <Stack.Screen name="AddPerson" component={AddPersonScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  loading: {
    marginTop: 50,
  },
  buttonContainer: {
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    alignItems: 'center',
    width: '70%',
    marginVertical: 10,
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webViewContainer: {
    flex: 1,
    width: '100%',
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  webview: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '90%',
    marginVertical: 10,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  imagePickerButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  previewImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
});

export default App;
