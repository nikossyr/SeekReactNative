// @flow

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image
} from "react-native";
import { getSystemName } from "react-native-device-info";
import { WebView } from "react-native-webview";

import i18n from "../../i18n";
import styles from "../../styles/species/wikipedia";
import icons from "../../assets/icons";

type Props = {
  +navigation: any
};

const Donation = ( { navigation }: Props ) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.text}>{i18n.t( "settings.donate" ).toLocaleUpperCase()}</Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.back}
      >
        <Image source={icons.closeWhite} />
      </TouchableOpacity>
    </View>
    <WebView
      startInLoadingState
      source={{ uri: `https://www.inaturalist.org/donate?utm_source=Seek_${getSystemName()}}` }}
    />
    <View style={styles.bottom} />
  </View>
);

export default Donation;
