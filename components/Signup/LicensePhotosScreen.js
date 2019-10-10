// @flow

import React, { Component } from "react";
import {
  Text,
  View,
  ScrollView
} from "react-native";
import Checkbox from "react-native-check-box";

import i18n from "../../i18n";
import styles from "../../styles/signup/signup";
import GreenHeader from "../UIComponents/GreenHeader";
import SafeAreaView from "../UIComponents/SafeAreaView";
import { checkIsEmailValid } from "../../utility/loginHelpers";
import ErrorMessage from "./ErrorMessage";
import InputField from "../UIComponents/InputField";
import GreenText from "../UIComponents/GreenText";
import GreenButton from "../UIComponents/GreenButton";

type Props = {
  +navigation: any
}

class LicensePhotosScreen extends Component<Props> {
  constructor() {
    super();

    this.state = {
      email: "",
      licensePhotos: true,
      error: false
    };
  }

  setError( error ) {
    this.setState( { error } );
  }

  toggleLicensePhotos() {
    const { licensePhotos } = this.state;

    this.setState( { licensePhotos: !licensePhotos } );
  }

  submit() {
    const { navigation } = this.props;
    const { email, licensePhotos } = this.state;
    if ( checkIsEmailValid( email ) ) {
      this.setError( false );
      navigation.navigate( "Signup", { email, licensePhotos } );
    } else {
      this.setError( true );
    }
  }

  render() {
    const { email, licensePhotos, error } = this.state;
    const { navigation } = this.props;

    return (
      <View style={styles.container}>
        <SafeAreaView />
        <GreenHeader header={i18n.t( "login.sign_up" )} navigation={navigation} />
        <ScrollView>
          <View style={styles.leftTextMargins}>
            <GreenText smaller text={i18n.t( "inat_signup.email" ).toLocaleUpperCase()} />
          </View>
          <InputField
            handleTextChange={value => this.setState( { email: value } )}
            placeholder={i18n.t( "inat_signup.email" )}
            text={email}
            type="emailAddress"
          />
          <View
            accessibilityLabel={i18n.t( "accessibility.check" )}
            accessible
            style={[styles.row, styles.margin, styles.center]}
          >
            <Checkbox
              checkBoxColor="#979797"
              isChecked={licensePhotos}
              onClick={() => this.toggleLicensePhotos()}
              style={styles.checkBox}
            />
            <Text style={styles.licenseText}>
              {i18n.t( "inat_signup.release_photos" )}
            </Text>
          </View>
          <View style={[styles.row, styles.center]}>
            <View style={{ marginLeft: 15 }} />
            <Text
              onPress={() => navigation.navigate( "Privacy" )}
              style={[styles.privacy, { marginTop: 2 }]}
            >
              {i18n.t( "inat_signup.privacy" )}
            </Text>
            <Text
              onPress={() => navigation.navigate( "TermsOfService" )}
              style={[styles.privacy, { marginTop: 2, marginLeft: 14 }]}
            >
              {i18n.t( "inat_signup.terms" )}
            </Text>
          </View>
          {error ? <ErrorMessage error="email" /> : <View style={styles.greenButtonMargin} />}
          <GreenButton
            handlePress={() => this.submit()}
            login
            text={i18n.t( "inat_signup.next" ).toLocaleUpperCase()}
          />
        </ScrollView>
      </View>
    );
  }
}

export default LicensePhotosScreen;
