import { StyleSheet } from "react-native";
import { colors, fonts, row } from "./global";

export default StyleSheet.create( {
  background: {
    backgroundColor: colors.white,
    flex: 1
  },
  block: {
    marginBottom: 34
  },
  boldText: {
    color: colors.black,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 5,
    textAlign: "center"
  },
  greenText: {
    color: colors.seekForestGreen,
    fontFamily: fonts.semibold,
    fontSize: 18,
    letterSpacing: 1.0
  },
  image: {
    height: 51,
    resizeMode: "contain",
    width: 300
  },
  margin: {
    marginBottom: 27
  },
  marginLeft: {
    marginLeft: 20
  },
  row,
  text: {
    color: colors.black,
    fontFamily: fonts.book,
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center"
  },
  textContainer: {
    alignItems: "center",
    marginHorizontal: 34,
    marginTop: 31
  }
} );
