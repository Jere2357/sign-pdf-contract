/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {StatusBar, View} from 'react-native';

import MainScreen from './src/screens/MainScreen';

const App = () => {
  return (
    <View>
      <StatusBar barStyle={'dark-content'} backgroundColor={'#fff'} />
      <MainScreen />
    </View>
  );
};

export default App;
