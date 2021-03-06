// @flow

import * as React from "react";
import { Platform, Dimensions, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import styles from "../../styles/navigation";
import i18n from "../../i18n";
import ARCamera from "../Camera/ARCamera/ARCamera";
import Gallery from "../Camera/Gallery/GalleryScreen";

const Tab = createMaterialTopTabNavigator();

const { width, length } = Dimensions.get( "window" );

const tabBarOptions = {
  labelStyle: styles.cameraTabLabel,
  style: styles.cameraTab,
  renderIndicator: props => {
    const { index } = props.navigationState;

    if ( index === 0 ) {
      return <View style={styles.indicator} />;
    } else {
      return <View style={styles.galleryIndicator} />;
    }
  }
};

const initialLayout = { width, length };

const swipeEnabled = Platform.OS === "ios" || false;

// this is only used for hot starting QuickActions
const initialCameraParams = { showWarning: false };

const CameraNav = () => (
  <Tab.Navigator
    tabBarPosition="bottom"
    swipeEnabled={swipeEnabled}
    initialLayout={initialLayout}
    tabBarOptions={tabBarOptions}
    // AR Camera is already a memory intensive screen
    // lazy means the gallery is not loading at the same time
    lazy
  >
    <Tab.Screen
      name="ARCamera"
      component={ARCamera}
      initialParams={initialCameraParams}
      // moving these to a constant means that language doesn't switch correctly
      options={{ tabBarLabel: i18n.t( "camera.label" ).toLocaleUpperCase() }}
    />
    <Tab.Screen
      name="Gallery"
      component={Gallery}
      options={{ tabBarLabel: i18n.t( "gallery.label" ).toLocaleUpperCase() }}
    />
  </Tab.Navigator>
);

export default CameraNav;
