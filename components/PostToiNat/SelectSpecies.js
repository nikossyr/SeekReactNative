// @flow

import React, { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard
} from "react-native";
import inatjs from "inaturalistjs";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../styles/global";
import styles from "../../styles/posting/selectSpecies";
import i18n from "../../i18n";
import posting from "../../assets/posting";
import SpeciesCard from "../UIComponents/SpeciesCard";
import { capitalizeNames } from "../../utility/helpers";
import GreenText from "../UIComponents/GreenText";
import createUserAgent from "../../utility/userAgent";
import icons from "../../assets/icons";
import Padding from "../UIComponents/Padding";
import { useScrollToTop } from "../../utility/customHooks";

type Props = {
  +toggleSpeciesModal: Function,
  +image: string,
  +updateTaxon: Function,
  +seekId: Object
}

const SelectSpecies = ( {
  toggleSpeciesModal,
  image,
  updateTaxon,
  seekId
}: Props ) => {
  const scrollView = useRef<any>( null );
  const navigation = useNavigation();
  const [suggestions, setSuggestions] = useState( [{
    image,
    commonName: seekId.preferredCommonName,
    scientificName: seekId.name,
    id: seekId.taxaId,
    iconicTaxonId: null
  }] );
  const [isSearching, setSearching] = useState( false );

  useScrollToTop( scrollView, navigation ); // custom, reusable hook

  const searchForSpecies = ( speciesName ) => {
    setSearching( true );
    const params = {
      q: speciesName,
      per_page: 5,
      is_active: true,
      locale: i18n.currentLocale()
    };

    const options = { user_agent: createUserAgent() };

    inatjs.taxa.autocomplete( params, options ).then( ( { results } ) => {
      const newSuggestions = [];

      if ( results.length > 0 ) {
        results.forEach( ( suggestion ) => {
          const suggestedSpecies = {
            image: suggestion.defaultPhoto && suggestion.defaultPhoto.medium_url
              ? suggestion.defaultPhoto.medium_url
              : null,
            commonName: capitalizeNames( suggestion.preferred_common_name || suggestion.name ),
            scientificName: suggestion.name,
            id: suggestion.id,
            iconicTaxonId: suggestion.iconic_taxon_id
          };

          newSuggestions.push( suggestedSpecies );
        } );
      }

      setSuggestions( newSuggestions );
    } ).catch( ( err ) => console.log( err, "couldn't find species" ) );
  };

  const dismissKeyboard = ( ) => Keyboard.dismiss( );

  const handleTextChange = text => searchForSpecies( text );

  const renderSuggestions = suggestions.map( ( item ) => {
    const handlePress = ( ) => {
      updateTaxon( item.id, item.commonName, item.scientificName );
      toggleSpeciesModal( );
    };

    const taxon = {
      preferredCommonName: item.commonName,
      name: item.scientificName,
      iconicTaxonId: item.iconicTaxonId
    };

    const photo = item.image && { uri: item.image }; // account for null case

    return (
      <View key={`${item.scientificName}${item.id}`} style={styles.card}>
        <SpeciesCard
          taxon={taxon}
          handlePress={handlePress}
          photo={photo}
        />
      </View>
    );
  } );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={i18n.t( "accessibility.back" )}
          accessible
          onPress={toggleSpeciesModal}
          style={styles.backButton}
        >
          <Image source={icons.backButton} />
        </TouchableOpacity>
        <Text style={styles.text}>
          {i18n.t( "posting.what_seen" ).toLocaleUpperCase()}
        </Text>
      </View>
      <ScrollView
        ref={scrollView}
        contentContainerStyle={styles.whiteContainer}
        keyboardDismissMode="on-drag"
        onScroll={dismissKeyboard}
        scrollEventThrottle={1}
      >
        <View style={styles.photoContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
        <View style={styles.row}>
          {/* $FlowFixMe */}
          <Image
            source={posting.searchGreen}
            tintColor={colors.white}
            style={styles.search}
          />
          <TextInput
            onChangeText={handleTextChange}
            placeholder={i18n.t( "posting.look_up" )}
            placeholderTextColor={colors.placeholderGray}
            style={styles.inputField}
          />
        </View>
        <View style={styles.textContainer}>
          {!isSearching && (
            <View style={styles.headerMargins}>
              <GreenText text="posting.id" />
            </View>
          ) }
          {renderSuggestions}
        </View>
        <Padding />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectSpecies;
