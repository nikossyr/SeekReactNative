import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-community/async-storage";
import * as StoreReview from "react-native-store-review";
import jwt from "react-native-jwt-io";
import { FileUpload } from "inaturalistjs";
import Realm from "realm";
import uuid from "react-native-uuid";
import { Platform, Alert, Linking } from "react-native";
import RNFS from "react-native-fs";
import moment from "moment";

import i18n from "../i18n";
import { deleteBadges, checkNumberOfBadgesEarned } from "./badgeHelpers";
import { recalculateChallenges, checkNumberOfChallengesCompleted } from "./challengeHelpers";
import iconicTaxaIds from "./iconicTaxonDictById";
import { isWithinPastYear } from "./dateHelpers";
import { fetchAccessToken } from "./loginHelpers";
import { createBackupUri } from "./photoHelpers";
import config from "../config";
import realmConfig from "../models/index";
import { createNotification } from "./notificationHelpers";

const checkForInternet = () => (
  new Promise( ( resolve ) => {
    NetInfo.fetch().then( ( { type } ) => {
      resolve( type );
    } ).catch( () => {
      resolve( null );
    } );
  } )
);

const capitalizeNames = ( name ) => {
  const titleCaseName = name.split( " " )
    .map( ( string ) => string.charAt( 0 ).toUpperCase() + string.substring( 1 ) )
    .join( " " );
  return titleCaseName;
};

const addARCameraFiles = () => {
  if ( Platform.OS === "android" ) {
    RNFS.copyFileAssets( "camera/optimized_model.tflite", `${RNFS.DocumentDirectoryPath}/optimized-model.tflite` )
      .then( ( result ) => {
        // console.log( result, "model in AR camera files" );
      } ).catch( ( error ) => {
        // console.log( error, "err in AR camera files" );
      } );

    RNFS.copyFileAssets( "camera/taxonomy.csv", `${RNFS.DocumentDirectoryPath}/taxonomy.csv` )
      .then( ( result ) => {
        // console.log( result, "taxonomy in AR camera files" );
      } ).catch( ( error ) => {
        // console.log( error, "err in AR camera files" );
      } );
  } else if ( Platform.OS === "ios" ) {
    RNFS.copyFile( `${RNFS.MainBundlePath}/optimized_model.mlmodelc`, `${RNFS.DocumentDirectoryPath}/optimized_model.mlmodelc` )
      .then( ( result ) => {
        // console.log( result, "model in AR camera files" );
      } ).catch( ( error ) => {
        // console.log( error, "err in AR camera files" );
      } );

    RNFS.copyFile( `${RNFS.MainBundlePath}/taxonomy.json`, `${RNFS.DocumentDirectoryPath}/taxonomy.json` )
      .then( ( result ) => {
        // console.log( result, "model in AR camera files" );
      } ).catch( ( error ) => {
        // console.log( error, "err in AR camera files" );
      } );
  }
};

const flattenUploadParameters = ( uri, time, latitude, longitude ) => {
  const params = {
    image: new FileUpload( {
      uri,
      name: "photo.jpeg",
      type: "image/jpeg"
    } ),
    observed_on: new Date( time * 1000 ).toISOString(),
    latitude,
    longitude
  };
  return params;
};

const createPlayStoreRatingAlert = () => {
  const url = "https://play.google.com/store/apps/details?id=org.inaturalist.seek";

  Alert.alert(
    i18n.t( "review.title" ),
    i18n.t( "review.rate" ),
    [{
      text: i18n.t( "review.later" ),
      style: "default"
    },
    {
      text: i18n.t( "review.rate_now" ),
      onPress: () => {
        Linking.canOpenURL( url )
          .then( ( supported ) => {
            if ( !supported ) {
              console.log( "Can't handle url: ", url );
            } else {
              return Linking.openURL( url );
            }
          } ).catch( ( err ) => console.error( "An error occurred", err ) );
      }
    }]
  );
};

const updateReviews = ( realm, reviews ) => {
  realm.write( () => {
    if ( reviews.length === 0 ) {
      realm.create( "ReviewRealm", {
        date: new Date(),
        timesSeen: 1
      } );
    } else {
      reviews[0].timesSeen += 1;
    }
  } );
  if ( Platform.OS === "android" ) {
    createPlayStoreRatingAlert();
  } else {
    StoreReview.requestReview();
  }
};

const deleteReviews = ( realm, reviews ) => {
  realm.write( () => {
    realm.delete( reviews );
  } );
};

const showAppStoreReview = () => {
  Realm.open( realmConfig )
    .then( ( realm ) => {
      const reviews = realm.objects( "ReviewRealm" );

      if ( reviews.length > 0 ) {
        const withinYear = isWithinPastYear( reviews[0].date );
        if ( withinYear && StoreReview.isAvailable ) {
          if ( reviews[0].timesSeen < 3 ) {
            updateReviews( realm, reviews );
          }
        } else if ( StoreReview.isAvailable ) {
          deleteReviews( realm, reviews );
          updateReviews( realm, reviews );
        }
      } else if ( StoreReview.isAvailable ) {
        updateReviews( realm, reviews );
      }
    } ).catch( () => {
      console.log( "couldn't show review modal" );
    } );
};

const showPlayStoreReview = async () => {
  const login = await fetchAccessToken();

  if ( login ) {
    Realm.open( realmConfig )
      .then( ( realm ) => {
        const reviews = realm.objects( "ReviewRealm" );

        if ( reviews.length > 0 ) {
          const withinYear = isWithinPastYear( reviews[0].date );
          if ( withinYear ) {
            if ( reviews[0].timesSeen < 3 ) {
              updateReviews( realm, reviews );
            }
          } else {
            deleteReviews( realm, reviews );
            updateReviews( realm, reviews );
          }
        } else {
          updateReviews( realm, reviews );
        }
      } ).catch( ( e ) => {
        console.log( "couldn't show review modal", e );
      } );
  }
};

const checkForPowerUsers = ( length, newLength ) => {
  if ( length < newLength ) {
    if ( newLength === 50 || newLength === 100 || newLength === 150 ) {
      createNotification( "badgeEarned" );
    }
  }
};

const addToCollection = async ( observation, latitude, longitude, uri, time ) => {
  const { taxon } = observation;
  const backupUri = await createBackupUri( uri ); // needs to happen before calculating badges

  checkNumberOfBadgesEarned();
  checkNumberOfChallengesCompleted();

  Realm.open( realmConfig )
    .then( ( realm ) => {
      const { length } = realm.objects( "TaxonRealm" );

      realm.write( () => {
        let defaultPhoto;
        const p = taxon.default_photo;
        if ( uri ) {
          defaultPhoto = realm.create( "PhotoRealm", {
            squareUrl: p ? p.medium_url : null,
            mediumUrl: uri,
            backupUri: backupUri || null
          } );
        }
        const newTaxon = realm.create( "TaxonRealm", {
          id: taxon.id,
          name: taxon.name,
          preferredCommonName:
            taxon.preferred_common_name
              ? capitalizeNames( taxon.preferred_common_name )
              : null,
          iconicTaxonId: taxon.iconic_taxon_id,
          ancestorIds: taxon.ancestor_ids,
          defaultPhoto
        } );
        realm.create( "ObservationRealm", {
          uuidString: uuid.v1(),
          date: time ? moment.unix( time ).format() : new Date(),
          taxon: newTaxon,
          latitude,
          longitude,
          placeName: null
        } );
      } );
      const newLength = realm.objects( "TaxonRealm" ).length;
      checkForPowerUsers( length, newLength );
    } ).catch( ( e ) => {
      console.log( e, "error adding to collection" );
    } );
};

const removeFromCollection = ( id ) => {
  Realm.open( realmConfig )
    .then( ( realm ) => {
      realm.write( () => {
        const obsToDelete = realm.objects( "ObservationRealm" ).filtered( `taxon.id == ${id}` );
        const taxonToDelete = obsToDelete[0].taxon;
        const photoObjToDelete = taxonToDelete.defaultPhoto;

        realm.delete( photoObjToDelete );
        realm.delete( obsToDelete );
        realm.delete( taxonToDelete );
        deleteBadges();
        recalculateChallenges();
      } );
    } ).catch( ( e ) => {
      console.log( e, "error removing from collection" );
    } );
};

const shuffleList = ( list ) => {
  const newList = list;

  for ( let i = list.length - 1; i > 0; i -= 1 ) {
    const j = Math.floor( Math.random() * ( i + 1 ) );
    [newList[i], newList[j]] = [list[j], list[i]];
  }

  return newList;
};

const HAS_LAUNCHED = "has_launched";

const setAppLaunched = () => {
  AsyncStorage.setItem( HAS_LAUNCHED, "true" );
};

const checkIfFirstLaunch = async () => {
  try {
    const hasLaunched = await AsyncStorage.getItem( HAS_LAUNCHED );
    if ( hasLaunched === null ) {
      setAppLaunched();
      return true;
    }
    return false;
  } catch ( error ) {
    return false;
  }
};

const CAMERA_LAUNCHED = "camera_launched";

const setCameraLaunched = ( boolean ) => {
  AsyncStorage.setItem( CAMERA_LAUNCHED, boolean.toString() );
};

const checkIfCameraLaunched = async () => {
  try {
    const cameraLaunched = await AsyncStorage.getItem( CAMERA_LAUNCHED );
    if ( cameraLaunched === null || cameraLaunched === "false" ) {
      setCameraLaunched( true );
      return true;
    }
    return false;
  } catch ( error ) {
    return false;
  }
};

const CARD_SHOWN = "card_shown";

const setCardShown = () => {
  AsyncStorage.setItem( CARD_SHOWN, "true" );
};

const checkIfCardShown = async () => {
  try {
    const hasShown = await AsyncStorage.getItem( CARD_SHOWN );
    if ( hasShown === null ) {
      setCardShown();
      return true;
    }
    return false;
  } catch ( error ) {
    return false;
  }
};

const getTaxonCommonName = ( taxonID ) => (
  new Promise( ( resolve ) => {
    Realm.open( realmConfig )
      .then( ( realm ) => {
        const searchLocale = i18n.currentLocale( ).split( "-" )[0].toLowerCase( );
        // look up common names for predicted taxon in the current locale
        const commonNames = realm.objects( "CommonNamesRealm" )
          .filtered( `taxon_id == ${taxonID} and locale == '${searchLocale}'` );
        resolve( commonNames.length > 0 ? capitalizeNames( commonNames[0].name ) : null );
      } ).catch( ( err ) => {
        console.log( "[DEBUG] Failed to open realm, error: ", err );
        resolve( );
      } );
  } )
);

const setSpeciesId = ( id ) => {
  AsyncStorage.setItem( "id", id.toString() );
};

const getSpeciesId = async () => {
  try {
    const id = await AsyncStorage.getItem( "id" );
    return Number( id );
  } catch ( error ) {
    return ( error );
  }
};

const setRoute = ( route ) => {
  AsyncStorage.setItem( "route", route );
};

const getRoute = async () => {
  try {
    const route = await AsyncStorage.getItem( "route" );
    return route;
  } catch ( error ) {
    return ( error );
  }
};

const sortNewestToOldest = ( observations ) => {
  observations.sort( ( a, b ) => {
    if ( a.data.length > b.data.length ) {
      return -1;
    }
    return 1;
  } );
};

const checkForIconicTaxonId = ( ancestorIds ) => {
  const taxaIdList = Object.keys( iconicTaxaIds ).reverse();
  taxaIdList.pop();
  taxaIdList.push( 47686, 48222 ); // checking for protozoans and kelp

  const newTaxaList = [];

  taxaIdList.forEach( ( id ) => {
    newTaxaList.push( Number( id ) );
  } );

  const iconicTaxonId = newTaxaList.filter( ( value ) => ancestorIds.indexOf( value ) !== -1 );

  return iconicTaxonId[0] || 1;
};

const fetchNumberSpeciesSeen = () => (
  new Promise( ( resolve ) => {
    Realm.open( realmConfig )
      .then( ( realm ) => {
        const { length } = realm.objects( "TaxonRealm" );
        resolve( length );
      } ).catch( () => {
        resolve( 0 );
      } );
  } )
);

const createJwtToken = () => {
  const claims = {
    application: "SeekRN",
    exp: new Date().getTime() / 1000 + 300
  };

  const token = jwt.encode( claims, config.jwtSecret, "HS512" );
  return token;
};

const seti18nNumber = ( number ) => i18n.toNumber( number, { precision: 0 } );

export {
  addARCameraFiles,
  addToCollection,
  capitalizeNames,
  flattenUploadParameters,
  getTaxonCommonName,
  checkIfFirstLaunch,
  checkIfCardShown,
  checkIfCameraLaunched,
  shuffleList,
  setSpeciesId,
  setCameraLaunched,
  getSpeciesId,
  setRoute,
  getRoute,
  checkForInternet,
  checkForIconicTaxonId,
  removeFromCollection,
  sortNewestToOldest,
  showAppStoreReview,
  showPlayStoreReview,
  fetchNumberSpeciesSeen,
  createJwtToken,
  seti18nNumber
};
