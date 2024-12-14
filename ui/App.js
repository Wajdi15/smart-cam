import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Video from 'react-native-video';

// Composants pour les différentes pages
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚀</Text>
      <Text style={styles.title}>Smart Cam</Text>
      
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.signupButton} 
        onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signupText}>Stop</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoginScreen() {
  return (
    <View style={styles.pageContainer}>
      <Video
        source={{uri: 'http://172.20.10.15:8080/feed1.ffm'}} // MJPEG stream URL
        ref={(ref) => {
          this.player = ref
        }}
        style={styles.backgroundVideo}
        controls={true}
        paused={false}
      />
    </View>
  );
}

function SignUpScreen() {
  return (
    <View style={styles.pageContainer}>
      <Text style={styles.pageText}>Sign Up Page</Text>
    </View>
  );
}

// Créer le Stack Navigator
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 80,
    color: '#8A2BE2',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 30,
    marginVertical: 20,
  },
  loginButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  pageText: {
    color: '#fff',
    fontSize: 24,
  },
  backgroundVideo: {
    width: '100%',
    height: '100%',
  },
});
