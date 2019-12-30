// @flow

import React from "react";
import {
  TouchableOpacity,
  Image
} from "react-native";
import { withNavigation } from "react-navigation";

import i18n from "../../i18n";
import styles from "../../styles/uiComponents/backArrow";
import icons from "../../assets/icons";

type Props = {
  +navigation: any,
  +route: string
}

const CustomBackArrow = ( { navigation, route }: Props ) => (
  <TouchableOpacity
    accessibilityLabel={i18n.t( "accessibility.back" )}
    accessible
    onPress={() => navigation.navigate( route )}
    style={styles.backButton}
  >
    <Image source={icons.backButton} />
  </TouchableOpacity>
);

export default withNavigation( CustomBackArrow );
