import { StyleSheet } from "react-native";
import { colors, margins, padding } from "./global";

export default StyleSheet.create( {
  container: {
    backgroundColor: colors.darkDesaturatedBlue,
    marginLeft: margins.medium,
    marginRight: margins.medium,
    paddingBottom: padding.medium,
    borderRadius: 5,
    height: 150,
    flexDirection: "row"
  },
  yAxis: {
    alignItems: "center",
    marginBottom: margins.medium
  },
  chartRow: {
    flex: 1,
    marginLeft: margins.small,
    marginRight: margins.small
  },
  chart: {
    flex: 1,
    marginTop: margins.medium,
    marginRight: margins.medium,
    borderLeftColor: colors.white,
    borderLeftWidth: 0.5,
    borderBottomColor: colors.white,
    borderBottomWidth: 1
  },
  contentInset: {
    top: 10,
    bottom: 10
  },
  xAxis: {
    // marginBottom: margins.smal,
    marginLeft: margins.small,
    height: 15
  }
} );
