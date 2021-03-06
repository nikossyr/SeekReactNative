// @flow

import React from "react";
import {
  View,
  Text,
  ImageBackground
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import i18n from "../../../i18n";
import styles from "../../../styles/home/challenges";
import backgrounds from "../../../assets/backgrounds";
import { setChallengeIndex } from "../../../utility/challengeHelpers";
import GreenButton from "../../UIComponents/Buttons/GreenButton";
import { colors } from "../../../styles/global";
import ChallengeTitle from "../../UIComponents/Challenges/ChallengeTitle";
import ChallengeBadgeRow from "../../UIComponents/Challenges/ChallengeBadgeRow";

type Props = {
  +challenge: {
    index: number,
    startedDate: Date,
    backgroundName: string,
    availableDate: Date,
    name: string
  }
}

const Challenges = ( { challenge }: Props ) => {
  const navigation = useNavigation();

  const navToChallengeDetails = () => {
    setChallengeIndex( challenge.index );
    navigation.navigate( "ChallengeDetails" );
  };

  const navToAllChallenges = () => navigation.navigate( "Challenges" );

  const buttonText = challenge.startedDate
    ? "challenges_card.continue_challenge"
    : "challenges_card.take_challenge";

  return (
    <ImageBackground
      source={backgrounds[challenge.backgroundName]}
      style={styles.challengeContainer}
    >
      <View style={styles.marginTop} />
      <ChallengeTitle challenge={challenge} />
      <View style={styles.marginSmall} />
      <ChallengeBadgeRow challenge={challenge} />
      <View style={styles.marginMedium} />
      <GreenButton
        color={colors.seekGreen}
        handlePress={navToChallengeDetails}
        text={buttonText}
      />
      <Text
        onPress={navToAllChallenges}
        style={styles.viewText}
      >
        {i18n.t( "challenges_card.view_all" )}
      </Text>
    </ImageBackground>
  );
};

export default Challenges;
