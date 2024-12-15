import React, { useState } from 'react';
import { Button, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
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
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          {!streaming ? (
            <Button title="Start Stream" onPress={startStream} />
          ) : (
            <Button title="Stop Stream" onPress={stopStream} />
          )}
          {streaming && (
            <WebView
              source={{ uri: 'http://172.20.10.2:5000/video_feed' }}
              style={styles.webview}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop : '30%'
  },
  webview: {
    flex: 1, // Ensures WebView takes all available space
  },
});

export default App;
