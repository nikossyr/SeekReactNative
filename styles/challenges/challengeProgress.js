// @flow

import { StyleSheet } from "react-native";
import {
  colors,
  fonts,
  row,
  dimensions
} from "../global";

const { height, width } = dimensions;

export default StyleSheet.create( {
  card: {
    justifyContent: "space-between",
    marginHorizontal: height > 570 ? 25 : 10,
    paddingVertical: 12
  },
  image: {
    height: 60,
    marginRight: height > 570 ? 25 : 10,
    resizeMode: "contain",
    width: 60
  },
  messageText: {
    fontFamily: fonts.book,
    fontSize: 14,
    lineHeight: 21
  },
  row,
  startButton: {
    alignItems: "center",
    width: 59
  },
  startText: {
    color: colors.seekForestGreen,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    textAlign: "center"
  },
  textContainer: {
    width: height > 570 ? width - 226 : 170
  },
  titleText: {
    color: colors.seekForestGreen,
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: 0.89,
    lineHeight: 20,
    marginBottom: 1
  }
} );
