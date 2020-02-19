// @flow

import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Platform
} from "react-native";
import Geocoder from "react-native-geocoder";

import i18n from "../../../i18n";
import LocationMap from "./LocationMap";
import { truncateCoordinates, fetchTruncatedUserLocation, fetchLocationName } from "../../../utility/locationHelpers";
import icons from "../../../assets/icons";
import styles from "../../../styles/home/locationPicker";
import GreenButton from "../../UIComponents/Buttons/GreenButton";
import SafeAreaView from "../../UIComponents/SafeAreaView";

const latitudeDelta = 0.2;
const longitudeDelta = 0.2;

type Props = {
  +latitude: ?number,
  +longitude: ?number,
  +location: ?string,
  +updateLocation: Function,
  +closeLocationPicker: Function
}

const LocationPicker = ( {
  latitude,
  longitude,
  location,
  updateLocation,
  closeLocationPicker
}: Props ) => {
  const [region, setRegion] = useState( {
    latitudeDelta,
    longitudeDelta,
    latitude,
    longitude
  } );

  const [inputLocation, setInputLocation] = useState( location );

  const setCoordsByLocationName = ( newLocation ) => {
    Geocoder.geocodeAddress( newLocation ).then( ( result ) => {
      if ( result.length === 0 ) {
        return;
      }
      const { locality, subAdminArea, position } = result[0];
      const { lng, lat } = position;

      setInputLocation( locality || subAdminArea );
      setRegion( {
        latitude: lat,
        longitude: lng,
        latitudeDelta,
        longitudeDelta
      } );
    } ).catch( ( e ) => {
      console.log( e, "error" );
    } );
  };

  const reverseGeocodeLocation = ( lat, lng ) => {
    fetchLocationName( lat, lng ).then( ( newLocation ) => {
      if ( newLocation === null ) {
        setInputLocation( i18n.t( "location_picker.undefined" ) );
      } else if ( inputLocation !== newLocation ) {
        setInputLocation( newLocation );
      }
    } ).catch( ( e ) => {
      console.log( e, "error" );
    } );
  };

  const handleRegionChange = ( newRegion ) => {
    if ( Platform.OS === "android" ) {
      reverseGeocodeLocation( newRegion.latitude, newRegion.longitude );
    }

    setRegion( newRegion );
  };

  const returnToUserLocation = () => {
    fetchTruncatedUserLocation().then( ( coords ) => {
      if ( coords ) {
        const lat = coords.latitude;
        const long = coords.longitude;
        reverseGeocodeLocation( lat, long );

        setRegion( {
          latitude: lat,
          longitude: long,
          latitudeDelta,
          longitudeDelta
        } );
      }
    } );
  };

  console.log( region, inputLocation, "region and input loc" );

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={i18n.t( "accessibility.back" )}
          accessible
          onPress={() => closeLocationPicker()}
          style={styles.backButton}
        >
          <Image source={icons.backButton} />
        </TouchableOpacity>
        <View style={styles.textContainer}>
          <Text style={styles.headerText}>
            {i18n.t( "location_picker.species_nearby" ).toLocaleUpperCase()}
          </Text>
        </View>
        <View style={styles.row}>
          <Image source={icons.locationWhite} />
          <TextInput
            accessibilityLabel={inputLocation}
            accessible
            autoCapitalize="words"
            onChangeText={text => setCoordsByLocationName( text )}
            placeholder={inputLocation}
            placeholderTextColor="#828282"
            style={styles.inputField}
            textContentType="addressCity"
          />
        </View>
      </View>
      <LocationMap
        onRegionChange={handleRegionChange}
        region={region}
        returnToUserLocation={returnToUserLocation}
      />
      <View style={styles.footer}>
        <GreenButton
          handlePress={() => {
            updateLocation(
              truncateCoordinates( region.latitude ),
              truncateCoordinates( region.longitude )
            );
            closeLocationPicker();
          }}
          letterSpacing={0.68}
          text="location_picker.button"
        />
      </View>
    </View>
  );
};

export default LocationPicker;
