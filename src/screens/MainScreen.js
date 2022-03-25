import React, {useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {PDFDocument} from 'pdf-lib';
import RNFS from 'react-native-fs';
import Signature from 'react-native-signature-canvas';
import {decode as atob, encode as btoa} from 'base-64';

import styles from './Styles';

const MainScreen = () => {
  const sourceUrl =
    'https://www.nd.gov/ndic/lrc/lrcinfo/pr-sample-contract.pdf';

  const [fileDownloaded, setFileDownloaded] = useState(false);
  const [getSignaturePad, setSignaturePad] = useState(false);
  const [pdfEditMode, setPdfEditMode] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState(null);
  const [signatureArrayBuffer, setSignatureArrayBuffer] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState(null);
  const [newPdfSaved, setNewPdfSaved] = useState(false);
  const [newPdfPath, setNewPdfPath] = useState(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [filePath, setFilePath] = useState(
    `${RNFS.DocumentDirectoryPath}/pr-sample-contract.pdf`,
  );

  const _base64ToArrayBuffer = base64 => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const _uint8ToBase64 = u8Arr => {
    const CHUNK_SIZE = 0x8000; //arbitrary number
    let index = 0;
    const length = u8Arr.length;
    let result = '';
    let slice;
    while (index < length) {
      slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
      result += String.fromCharCode.apply(null, slice);
      index += CHUNK_SIZE;
    }
    return btoa(result);
  };

  const readFile = () => {
    RNFS.readFile(
      `${RNFS.DocumentDirectoryPath}/pr-sample-contract.pdf`,
      'base64',
    )
      .then(contents => {
        setPdfBase64(contents);
        setPdfArrayBuffer(_base64ToArrayBuffer(contents));
      })
      .catch(function (error) {
        console.log(
          'There has been a problem with readFile(): ' + error.message,
        );
      });
  };

  const downloadFile = () => {
    if (!fileDownloaded) {
      console.log('Source URL: ', sourceUrl);
      console.log('File Path: ', filePath);
      RNFS.downloadFile({
        fromUrl: sourceUrl,
        toFile: filePath,
      })
        .promise.then(res => {
          setFileDownloaded(true);
          readFile();
        })
        .catch(function (error) {
          console.log(
            'There has been a problem with downloadFile(): ' + error.message,
          );
        });
    }
  };

  const getSignature = () => {
    setSignaturePad(true);
  };

  const handleSignature = signature => {
    setSignatureBase64(signature.replace('data:image/png;base64,', ''));
    setSignaturePad(false);
    setPdfEditMode(true);
  };

  const handleSingleTap = async (page, x, y) => {
    if (pdfEditMode) {
      setNewPdfSaved(false);
      setFilePath(null);
      setPdfEditMode(false);
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[page - 1];
      // The meat
      const signatureImage = await pdfDoc.embedPng(signatureArrayBuffer);
      console.log('Started AWAIT;');
      if (Platform.OS === 'ios') {
        firstPage.drawImage(signatureImage, {
          x: (pageWidth * (x - 12)) / Dimensions.get('window').width,
          y: pageHeight - (pageHeight * (y + 12)) / 540,
          width: 150,
          height: 100,
        });
      } else {
        firstPage.drawImage(signatureImage, {
          x: (firstPage.getWidth() * x) / pageWidth,
          y:
            firstPage.getHeight() -
            (firstPage.getHeight() * y) / pageHeight -
            25,
          width: 150,
          height: 100,
        });
      }
      console.log('platform checked: ', firstPage);
      // Play with these values as every project has different requirements
      const pdfBytes = await pdfDoc.save();
      const PDFBase64 = _uint8ToBase64(pdfBytes);
      const path = `${
        RNFS.DocumentDirectoryPath
      }/pr-sample-contract_signed_${Date.now()}.pdf`;
      console.log('new path ina', path);
      RNFS.writeFile(path, PDFBase64, 'base64')
        .then(success => {
          console.log('success writing the file!');
          setNewPdfPath(path);
          setNewPdfSaved(true);
          setPdfBase64(PDFBase64);
        })
        .catch(err => {
          console.log('Failed writing the file!');
          console.log(err.message);
        });
    }
  };

  useEffect(() => {
    downloadFile();
    if (signatureBase64) {
      setSignatureArrayBuffer(_base64ToArrayBuffer(signatureBase64));
    }
    if (newPdfSaved) {
      setFilePath(newPdfPath);
      setPdfArrayBuffer(_base64ToArrayBuffer(pdfBase64));
    }
    console.log('filePath: ', filePath);
    console.log('new pdf saved: ', newPdfSaved);
  }, [signatureBase64, filePath, pdfBase64]);

  return (
    <View style={styles.container}>
      {getSignaturePad ? (
        <Signature
          onOK={sig => handleSignature(sig)}
          onEmpty={() => console.log('___onEmpty')}
          descriptionText="Sign"
          clearText="Clear"
          confirmText="Save"
        />
      ) : (
        fileDownloaded && (
          <View>
            {filePath ? (
              <Pdf
                minScale={1.0}
                maxScale={1.0}
                scale={1.0}
                spacing={10}
                fitPolicy={0}
                enablePaging={true}
                source={{uri: filePath}}
                usePDFKit={false}
                onLoadComplete={(numberOfPages, filePath, {width, height}) => {
                  setPageWidth(width);
                  setPageHeight(height);
                }}
                onPageSingleTap={(page, x, y) => {
                  handleSingleTap(page, x, y);
                }}
                style={styles.pdf}
              />
            ) : (
              <View style={styles.button}>
                <Text style={styles.buttonText}>Saving PDF File...</Text>
              </View>
            )}
            {pdfEditMode ? (
              <View style={styles.message}>
                <Text>* EDIT MODE *</Text>
                <Text>Touch where you want to place the signature</Text>
              </View>
            ) : (
              filePath && (
                <View>
                  <TouchableOpacity
                    onPress={getSignature}
                    style={styles.button}>
                    <Text style={styles.buttonText}>Sign Document</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        )
      )}
    </View>
  );
};

export default MainScreen;
