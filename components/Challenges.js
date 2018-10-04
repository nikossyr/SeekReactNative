import React, { Component } from "react";
import inatjs from "inaturalistjs";

import {
  TouchableOpacity,
  Image,
  FlatList,
  ImageBackground,
  Text,
  View,
  StatusBar,
  ActivityIndicator
} from "react-native";

import styles from "../styles/challenges";

class Challenges extends Component {
  constructor() {
    super();

    this.state = {
      taxa: [],
      loading: true
    };
  }

  componentDidMount() {
    const params = {
      verifiable: true,
      photos: true,
      per_page: 9,
      lat: 40.7128, // 37.7749, San Francisco hardcoded for testing
      lng: -74.0060, // -122.4194, San Francisco hardcoded for testing
      radius: 50,
      threatened: false,
      oauth_application_id: "2,3",
      hrank: "species",
      include_only_vision_taxa: true,
      not_in_list_id: 945029
    };

    inatjs.observations.speciesCounts( params ).then( ( response ) => {
      const challenges = response.results.map( r => r.taxon );
      this.setTaxa( challenges );
    } );
  }

  setTaxa( challenges ) {
    this.setState( {
      taxa: challenges,
      loading: false
    } );
  }

  capitalizeNames( name ) {
    const titleCaseName = name.split( " " )
      .map( string => string.charAt( 0 ).toUpperCase() + string.substring( 1 ) )
      .join( " " );
    return titleCaseName;
  }

  loading( ) {
    return (
      <View style={ styles.loadingWheel }>
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  results( taxa ) {
    const {
      navigation
    } = this.props;

    return (
      <View>
        <ImageBackground
          style={styles.backgroundImage}
          source={require( "../assets/backgrounds/background.png" )}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Species you&apos;re most likely to see near: </Text>
            <TouchableOpacity
              style={styles.locationChooser}
              onPress={() => navigation.navigate( "Loading" )}
            >
              <Text style={styles.locationChooserText}>Pick Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.taxonChooser}
              onPress={() => navigation.navigate( "Loading" )}
            >
              <Text style={styles.taxonChooserText}>Pick Taxon</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ taxa }
            keyExtractor={ taxon => taxon.id }
            numColumns={ 3 }
            renderItem={ ( { item } ) => (
              <View style={ styles.gridCell }>
                <TouchableOpacity
                  onPress={ ( ) => alert( "Button pressed" ) }
                >
                  <View style={ styles.gridCellContents }>
                    <Image
                      style={ {
                        width: "100%",
                        aspectRatio: 1.1
                      } }
                      source={ { uri: item.default_photo.medium_url } }
                    />
                    <View style={ styles.cellTitle }>
                      <Text style={ styles.cellTitleText }>
                        { this.capitalizeNames( item.preferred_common_name || item.name ) }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ) }
          />
        </ImageBackground>
      </View>
    );
  }

  render() {
    const {
      taxa,
      loading
    } = this.state;

    const challenges = loading ? this.loading( ) : this.results( taxa );

    return (
      <View style={ { flex: 1 } }>
        <View style={ styles.container }>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#4F6D7A"
          />
          { challenges }
        </View>
      </View>
    );
  }
}

export default Challenges;
