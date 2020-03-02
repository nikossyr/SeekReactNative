// @flow

import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";

import styles from "../../../styles/home/speciesNearby";
import LoadingWheel from "../../UIComponents/LoadingWheel";
import Error from "./Error";
import { colors } from "../../../styles/global";
import SpeciesNearbyList from "../../UIComponents/SpeciesNearbyList";
import i18n from "../../../i18n";
import taxonIds from "../../../utility/dictionaries/taxonDict";
import createUserAgent from "../../../utility/userAgent";

type Props = {
  latitude: ?number,
  longitude: ?number,
  taxaType: string,
  error: ?string,
  checkForErrors: Function
}

const SpeciesNearbyContainer = ( {
  taxaType,
  latitude,
  longitude,
  error,
  checkForErrors
}: Props ) => {
  const [taxa, setTaxa] = useState( [] );
  const [loading, setLoading] = useState( true );

  const fetchSpeciesNearby = useCallback( ( params ) => {
    const site = "https://api.inaturalist.org/v1/taxa/nearby";
    // $FlowFixMe
    const queryString = Object.keys( params ).map( key => `${key}=${params[key]}` ).join( "&" );

    const options = { headers: { "User-Agent": createUserAgent() } };

    fetch( `${site}?${queryString}`, options )
      .then( response => response.json() )
      .then( ( { results } ) => {
        setTaxa( results.map( r => r.taxon ) );
        setLoading( false );
      } ).catch( () => {
        checkForErrors();
      } );
  }, [checkForErrors] );

  const setParamsForSpeciesNearby = useCallback( () => {
    const params = {
      per_page: 20,
      lat: latitude,
      lng: longitude,
      observed_on: new Date(),
      seek_exceptions: true,
      locale: i18n.locale
    };

    if ( taxonIds[taxaType] ) {
      // $FlowFixMe
      params.taxon_id = taxonIds[taxaType];
    }

    fetchSpeciesNearby( params );
  }, [taxaType, latitude, longitude, fetchSpeciesNearby] );

  useEffect( () => {
    if ( loading ) {
      setParamsForSpeciesNearby();
    }
  }, [loading, setParamsForSpeciesNearby] );

  useEffect( () => {
    setLoading( true ); // set loading when user changes location or taxaType
  }, [taxaType, latitude, longitude] );

  useEffect( () => {
    if ( error ) {
      setLoading( false );
      setTaxa( [] );
    } else {
      setLoading( true ); // set loading when error changes to null
    }
  }, [error] );

  const renderSpeciesContainer = () => {
    let species;

    if ( error ) {
      species = (
        <Error
          error={error}
          requestAndroidPermissions={checkForErrors}
        />
      );
    } else if ( loading ) {
      species = (
        <LoadingWheel color={colors.black} />
      );
    } else {
      species = (
        <SpeciesNearbyList taxa={taxa} />
      );
    }
    return species;
  };

  return (
    <View style={styles.speciesNearbyContainer}>
      {renderSpeciesContainer()}
    </View>
  );
};

export default SpeciesNearbyContainer;