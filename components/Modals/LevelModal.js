// @flow

import React from "react";
import {
  View,
  Text,
  Image
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import i18n from "../../i18n";
import styles from "../../styles/modals/levelModal";
import { colors } from "../../styles/global";
import badgeImages from "../../assets/badges";
import GreenText from "../UIComponents/GreenText";
import WhiteModal from "../UIComponents/Modals/WhiteModal";

type Props = {
  +level: Object,
  +speciesCount: ?number,
  +closeModal: Function,
  +screen?: ?string
};

const LevelModal = ( {
  level,
  speciesCount,
  closeModal,
  screen
}: Props ) => (
  <WhiteModal closeModal={closeModal}>
    <View style={styles.headerMargins}>
      <GreenText text={screen === "achievements"
        ? "badges.your_level"
        : "banner.level_up"}
      />
    </View>
    {/* $FlowFixMe */}
    <LinearGradient
      colors={[colors.greenGradientLight, colors.greenGradientDark]}
      style={styles.backgroundColor}
    >
      <Image
        source={badgeImages[level.earnedIconName]}
        style={styles.image}
      />
      <Text style={styles.nameText}>{i18n.t( level.intlName ).toLocaleUpperCase()}</Text>
    </LinearGradient>
    <View>
      <Text style={styles.text}>{i18n.t( "banner.number_seen_plural", { count: speciesCount } )}</Text>
    </View>
  </WhiteModal>
);

LevelModal.defaultProps = {
  screen: null
};

export default LevelModal;
