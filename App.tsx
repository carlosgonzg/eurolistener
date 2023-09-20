/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors
} from 'react-native/Libraries/NewAppScreen';

// Addind the permissions API from react native
import Permissions from 'react-native-permissions';

// Implementation for permissions
const requestPermission = async () => {
  return await Permissions.request(
    Permissions.PERMISSIONS.ANDROID.RECORD_AUDIO,
    {
      title: 'EuroListener needs permission to  our mic',
      message: 'EuroListener needs permission to check your audio to provide a better experience',
      buttonPositive: 'Ok',
      buttonNegative: 'Cancel'
    }
  )
};

// checking the permissions function
const checkPermissions = async () => {
  const p = await Permissions.check(Permissions.PERMISSIONS.ANDROID.RECORD_AUDIO)
  console.log('permission checked', p)
  if (p === 'granted') return;
  return await requestPermission();
}

// importing the audio record
import AudioRecord from 'react-native-audio-record';

const audioOptions = {
  sampleRate: 16000,  // default 44100
  channels: 1,        // 1 or 2, default 1
  bitsPerSample: 16,  // 8 or 16, default 16
  audioSource: 6,     // android only (see below)
  wavFile: 'test.wav' // default 'audio.wav'
};

// importing the sound 
import Sound from 'react-native-sound';

// importing with the background timer
import BackgroundTimer from 'react-native-background-timer';

// importing moment
import Moment from 'moment';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  let sound: Sound | null = null;
  const [audioFile, setAudioFile] = useState('')
  const [recording, setRecording] = useState(0)
  const [lastRecord, setLastRecord] = useState(new Date())

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
    justifyContent: 'center'
  };

  // Audio implementation
  const startRecord = () => {
    if(!AudioRecord)
      return;
    console.log('started recording')
    setAudioFile('')
    AudioRecord.init({
      ...audioOptions,
      wavFile: `file_${Moment().format('yyyy_MM_DD_hh_mm_ss')}.wav`
    })
    AudioRecord.start();
  }
  const stopRecord = async () => {
    if(!AudioRecord)
      return;
    console.log('stopped recording')
    let audioFile = await AudioRecord.stop();
    console.log('audio file', audioFile)
    setAudioFile(audioFile)
    setLastRecord(new Date())
  }

  const loadRecord = () => {
    return new Promise((resolve) => {
      if (!audioFile) {
        Alert.alert('Error', 'There is no record')
        return;
      }
      sound = new Sound(audioFile, '', (error) => {
        if (error) {
          Alert.alert('Error', 'Failed to load record')
          return;
        }
        Sound.setCategory('Playback')
        resolve(null);
      })
    });
  }
  const playRecord = async () => {
    console.log('playing record')
    await loadRecord();
    if (sound)
      sound.play((success) => {
        Alert.alert('Success', 'Finished playing the record')
      })
  }

  // using useEffect for the first loading
  useEffect(() => {
    checkPermissions()
      .then((v) => {
        console.log('finished permissions')
        console.log('initiating audio')
        AudioRecord.init(audioOptions);

        // setting up background timer
        BackgroundTimer.runBackgroundTimer(() => {
          // code that will be called every 3 seconds 
          const oldValue = recording
          setRecording((r) => {
            return r >= 3 ? 0 : r + 1 
          })
          console.log('calling recording (old, new)', oldValue, recording)
        },
          5000);
      })
  }, [])

  // this use effect is for the recording change
  useEffect(() => {
    if(recording === 0){
      return;
    }
    // here we will stop the audio and start a new one
    console.log('recording state', recording)
    if (recording === 1) {
      startRecord();
    }
    else if (recording === 2) {
      stopRecord();
    }
    else if (recording >= 3) {
      console.log('resetting audio')
    }
  }, [recording])

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={styles.row}>
        <Text>{Moment(lastRecord).format('yyyy-MM-DD HH:mm:ss')}</Text>
        <Button onPress={playRecord} title="Play last record" />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    justifyContent: 'space-evenly'
  }
})
export default App;
