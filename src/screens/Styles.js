import {StyleSheet, Dimensions} from 'react-native';

const Styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  pdf: {
    width: Dimensions.get('window').width,
    height: 540,
  },
  headerText: {
    color: '#508DBC',
    fontSize: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#508DBC',
    padding: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#DAFFFF',
  },
  message: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF88C',
  },
});

export default Styles;
