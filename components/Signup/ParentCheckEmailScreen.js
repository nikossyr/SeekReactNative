// @flow

import React from "react";
import {
  View,
  Text
} from "react-native";

import i18n from "../../i18n";
import styles from "../../styles/signup/signup";
import GreenHeader from "../UIComponents/GreenHeader";
import SafeAreaView from "../UIComponents/SafeAreaView";
import GreenButton from "../UIComponents/GreenButton";

type Props = {
  +navigation: any
}

const ParentCheckEmailScreen = ( { navigation }: Props ) => (
  <View style={styles.container}>
    <SafeAreaView />
    <GreenHeader header={i18n.t( "login.sign_up" )} navigation={navigation} />
    <View style={styles.flexCenter}>
      <Text style={styles.headerText}>{i18n.t( "inat_signup.thanks" ).toLocaleUpperCase()}</Text>
      <Text style={styles.text}>{i18n.t( "inat_signup.parent_instructions" )}</Text>
      <View style={{ marginTop: 51 }} />
      <GreenButton
        fontSize={16}
        handlePress={() => navigation.navigate( "Home" )}
        login
        text={i18n.t( "inat_signup.continue_no_log_in" ).toLocaleUpperCase()}
      />
    </View>
  </View>
);

export default ParentCheckEmailScreen;
