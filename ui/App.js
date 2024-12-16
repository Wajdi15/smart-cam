import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  ImageBackground 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';  // Importer le bon module pour ImagePicker
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BlurView } from 'expo-blur'; // Importer le composant BlurView


// Composant principal
function HomeScreen({ navigation }) {
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);

  const startStream = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://172.20.10.2:5000/start_stream', {
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
      const response = await fetch('http://172.20.10.2:5000/stop_stream', {
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
      <View style={styles.container}>
      <Image source={require('./assets/camera.png')} style={styles.logo} />
        <Text style={styles.title}>Smart Cam</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            {!streaming ? (
              <TouchableOpacity style={styles.startButton} onPress={startStream}>
                <Text style={styles.buttonText}>Start Stream</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopStream}>
                <Text style={styles.buttonText}>Stop Stream</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('AddPerson')}
            >
              <Text style={styles.buttonText}>Add Person</Text>
            </TouchableOpacity>
          </>
        )}

        {streaming && (
          <WebView
            source={{ uri: 'http://172.20.10.2:5000/video_feed' }}
            style={styles.webview}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Composant pour la page Ajouter une personne
function AddPersonScreen() {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null); // To store the selected image
  const [loading, setLoading] = useState(false);

  // Demander la permission pour accéder à la galerie d'images
  const uploadPicture = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setImage(result.assets[0].uri);
    }
  };

  // Prendre une photo
  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync(); // Demander la permission pour la caméra

    if (status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImage(result.assets[0].uri);
      }
    } else {
      Alert.alert('Permission Required', 'Camera permission is required to take a photo.');
    }
  };

  // Fonction pour gérer la soumission du formulaire
  const handleAddPerson = async () => {
    if (!name || !image) {
      Alert.alert('Validation Error', 'Please fill in all fields and upload a picture.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('age', '25'); // Remplacer par un âge dynamique
      formData.append('image', {
        uri: image,
        type: 'image/jpeg',  // Vous pouvez ajuster le type selon votre image
        name: image.split('/').pop(),
      });

      const response = await fetch('http://172.20.10.2:5000/add_person', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Person added successfully!');
        setName('');
        setImage(null); // Effacer l'image après soumission
      } else {
        Alert.alert('Error', result.message || 'Failed to add person.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.addPersonContainer}>
      <ImageBackground
        source={require('./assets/face.jpg')} // Image de fond
        style={styles.backgroundImage}
      >
        <BlurView intensity={10} style={styles.blurView}>
      <Text style={styles.addPersonText}>Add a New Person</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter name                                                          "
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Télécharger ou prendre une photo */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={uploadPicture}>
          <Text style={styles.buttonText}>Upload Picture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>
      </View>

      {/* Afficher l'image sélectionnée */}
      {image && (
        <View style={styles.imageContainer}>
          <Text style={styles.label}>Selected Image:</Text>
          <Image source={{ uri: image }} style={styles.imagePreview} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.submitButton} onPress={handleAddPerson}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      )}
      </BlurView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// Configuration du Stack Navigator
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{
          title:"Add Person",
    headerShown: true, // Si vous voulez afficher l'en-tête
    headerStyle: {
      backgroundColor: '#2c2b49', // Rendre l'en-tête transparent
      elevation: 0, // Supprimer l'ombre de l'en-tête (sur Android)
      shadowOpacity: 0, // Supprimer l'ombre (sur iOS)
    },
    headerTintColor: 'white', // Couleur des éléments du header (par exemple, les icônes)
    headerTitleStyle: {
      fontWeight: 'bold', // Personnalisation du titre si nécessaire
    },
  }}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CDC1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300, // Adjust size as needed
    height: 300, // Adjust size as needed
    marginBottom: -30,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond légèrement transparent
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  startButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  stopButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  addPersonContainer: {
    flex: 1,
    backgroundColor: '#CDC1FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addPersonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 20,
  },
  inputContainer: {
    width: '200%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#8A2BE2',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#8B5DFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
});
