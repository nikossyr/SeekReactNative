// @flow

import React, {
  useReducer,
  useEffect,
  useRef,
  useCallback
} from "react";
import { ScrollView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import inatjs from "inaturalistjs";
import Realm from "realm";
import { useSafeArea } from "react-native-safe-area-context";

import i18n from "../../i18n";
import { fetchTruncatedUserLocation } from "../../utility/locationHelpers";
import { checkLocationPermissions } from "../../utility/androidHelpers.android";
import realmConfig from "../../models/index";
import styles from "../../styles/species/species";
import SpeciesError from "./SpeciesError";
import Spacer from "../UIComponents/TopSpacer";
import {
  getSpeciesId,
  getRoute,
  checkForInternet,
  getTaxonCommonName
} from "../../utility/helpers";
import NoInternetError from "./OnlineOnlyCards/NoInternetError";
import createUserAgent from "../../utility/userAgent";
import { formatShortMonthDayYear } from "../../utility/dateHelpers";
import SpeciesHeader from "./SpeciesHeader";

const latitudeDelta = 0.2;
const longitudeDelta = 0.2;

const SpeciesDetail = () => {
  const insets = useSafeArea();
  const scrollView = useRef( null );
  const navigation = useNavigation();

  // eslint-disable-next-line no-shadow
  const [state, dispatch] = useReducer( ( state, action ) => {
    console.log( action.type, "type" );
    switch ( action.type ) {
      case "ERROR":
        return { ...state, error: "internet" };
      case "NO_ERROR":
        return { ...state, error: null };
      case "SET_ID_AND_ROUTE":
        return { ...state, id: action.id, routeName: action.routeName };
      case "SET_TAXON_STATS":
        return { ...state, stats: action.stats };
      case "SET_USER_LOCATION":
        return { ...state, region: action.region };
      case "SET_TAXON_DETAILS":
        return {
          ...state,
          taxon: action.taxon,
          photos: action.photos,
          wikiUrl: action.wikiUrl,
          about: action.about,
          timesSeen: action.timesSeen,
          ancestors: action.ancestors,
          stats: action.stats
        };
      case "TAXA_SEEN":
        return {
          ...state,
          taxon: action.taxon,
          seenDate: action.seenDate,
          region: action.region
        };
      case "RESET_SCREEN":
        return {
          ...state,
          photos: [],
          taxon: {},
          about: null,
          seenDate: null,
          timesSeen: null,
          region: {},
          error: null,
          stats: {},
          ancestors: [],
          routeName: null,
          wikiUrl: null
        };
      default:
        throw new Error();
    }
  }, {
    id: null,
    photos: [],
    taxon: {
      commonName: null,
      scientificName: null,
      iconicTaxonId: null
    },
    about: null,
    seenDate: null,
    timesSeen: null,
    region: {},
    error: null,
    seenTaxa: null,
    stats: {},
    ancestors: [],
    routeName: null,
    wikiUrl: null
  } );

  const {
    about,
    taxon,
    id,
    photos,
    region,
    seenDate,
    timesSeen,
    error,
    seenTaxa,
    ancestors,
    stats,
    routeName,
    wikiUrl
  } = state;

  const setupScreen = async () => {
    const id = await getSpeciesId();
    const routeName = await getRoute();

    dispatch( { type: "SET_ID_AND_ROUTE", id, routeName } );
  };

  const setSeenTaxa = useCallback( ( seenTaxa ) => {
    const { taxon, latitude, longitude } = seenTaxa;

    getTaxonCommonName( id ).then( ( name ) => {
      dispatch( {
        type: "TAXA_SEEN",
        taxon: {
          commonName: name,
          scientificName: taxon.name,
          iconicTaxonId: taxon.iconicTaxonId
        },
        seenDate: seenTaxa ? formatShortMonthDayYear( seenTaxa.date ) : null,
        region: {
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta
        }
      } );
    } ).catch( ( e ) => console.log( "couldn't fetch device common name", e ) );
  }, [id] );

  const setUserLocation = useCallback( () => {
    fetchTruncatedUserLocation().then( ( coords ) => {
      const { latitude, longitude } = coords;

      dispatch( {
        type: "SET_USER_LOCATION",
        region: {
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta
        }
      } );
    } ).catch( () => console.log( "couldn't fetch location") );
  }, [] );

  const fetchUserLocation = useCallback( () => {
    if ( Platform.OS === "android" ) {
      checkLocationPermissions().then( ( granted ) => {
        if ( granted ) {
          setUserLocation();
        }
      } );
    } else {
      setUserLocation();
    }
  }, [setUserLocation] );

  const checkIfSpeciesSeen = useCallback( () => {
    Realm.open( realmConfig ).then( ( realm ) => {
      const observations = realm.objects( "ObservationRealm" );
      const seenTaxa = observations.filtered( `taxon.id == ${id}` )[0];

      if ( seenTaxa ) {
        setSeenTaxa( seenTaxa );
      } else {
        fetchUserLocation();
      }
    } ).catch( ( e ) => console.log( "[DEBUG] Failed to open realm, error: ", e ) );
  }, [id, fetchUserLocation, setSeenTaxa] );

  const checkInternetConnection = () => {
    checkForInternet().then( ( internet ) => {
      if ( internet === "none" || internet === "unknown" ) {
        dispatch( { type: "INTERNET_ERROR" } );
      } else {
        dispatch( { type: "NO_ERROR" } );
      }
    } );
  };

  const fetchTaxonDetails = useCallback( () => {
    const params = { locale: i18n.currentLocale() };
    const options = { user_agent: createUserAgent() };

    inatjs.taxa.fetch( id, params, options ).then( ( response ) => {
      const taxa = response.results[0];
      const commonName = taxa.preferred_common_name;
      const scientificName = taxa.name;
      const conservationStatus = taxa.taxon_photos[0].taxon.conservation_status;
      const ancestors = [];
      const ranks = ["kingdom", "phylum", "class", "order", "family", "genus"];
      taxa.ancestors.forEach( ( ancestor ) => {
        if ( ranks.includes( ancestor.rank ) ) {
          ancestors.push( ancestor );
        }
      } );

      ancestors.push( {
        rank: "species",
        name: scientificName || null,
        preferred_common_name: commonName || null
      } );

      stats.endangered = ( conservationStatus && conservationStatus.status_name === "endangered" ) || false;

      getTaxonCommonName( id ).then( ( deviceCommonName ) => {
        dispatch( {
          type: "SET_TAXON_DETAILS",
          taxon: {
            commonName: deviceCommonName || commonName,
            scientificName,
            iconicTaxonId: taxa.iconic_taxon_id
          },
          photos: taxa.taxon_photos.map( ( p ) => p.photo ),
          wikiUrl: taxa.wikipedia_url,
          about: taxa.wikipedia_summary
            ? i18n.t( "species_detail.wikipedia", {
              about: taxa.wikipedia_summary.replace( /<[^>]+>/g, "" ).replace( "&amp", "&" )
            } )
            : null,
          timesSeen: taxa.observations_count,
          ancestors,
          stats
        } );
      } );
    } ).catch( () => checkInternetConnection() );
  }, [id, stats] );

  const checkIfSpeciesIsNative = useCallback( () => {
    const params = {
      per_page: 1,
      lat: region.latitude,
      lng: region.longitude,
      radius: 50,
      taxon_id: id
    };

    const options = { user_agent: createUserAgent() };

    inatjs.observations.search( params, options ).then( ( { results } ) => {
      if ( results.length > 0 ) {
        const { taxon } = results[0];
        if ( taxon ) {
          stats.threatened = taxon.threatened;
          stats.endemic = taxon.endemic;
          stats.introduced = taxon.introduced;
          stats.native = taxon.native;
          dispatch( { type: "SET_TAXON_STATS", stats } );
        }
      }
    } ).catch( ( err ) => console.log( err, "err fetching native threatened etc" ) );
  }, [id, region, stats] );

  useEffect( () => {
    if ( region.latitude ) {
      checkIfSpeciesIsNative();
    }
  }, [region.latitude, checkIfSpeciesIsNative] );

  const scrollToTop = () => {
    if ( scrollView.current ) {
      scrollView.current.scrollTo( {
        x: 0, y: 0, animated: Platform.OS === "android"
      } );
    }
  };

  const fetchiNatData = useCallback( () => {
    // dispatch( { type: "RESET_SCREEN" } );
    console.log( "setting up screen" );
    setupScreen();

    if ( Platform.OS === "android" ) {
      setTimeout( () => scrollToTop(), 1 );
      // hacky but this fixes scroll not getting to top of screen
    } else {
      scrollToTop();
    }
  }, [] );

  useEffect( () => {
    if ( id ) {
      checkIfSpeciesSeen();
      fetchTaxonDetails();
    }
  }, [id, checkIfSpeciesSeen, fetchTaxonDetails] );

  useEffect( () => {
    navigation.addListener( "focus", () => {
      fetchiNatData();
    } );
    navigation.addListener( "blur", () => {
      console.log( routeName, "route name" );
      dispatch( { type: "RESET_SCREEN" } );
    } );
  }, [navigation, fetchiNatData, routeName] );

  const { commonName } = taxon;

  return (
    <ScrollView
      ref={scrollView}
      contentContainerStyle={[
        styles.footerMargin,
        styles.background,
        styles.greenBanner,
        { paddingTop: insets.top }
      ]}
    >
      <Spacer />
      <SpeciesHeader
        taxon={taxon}
        seenTaxa={seenTaxa}
        photos={photos}
        routeName={routeName}
      />
      {error === "internet" ? (
        <SpeciesError seenDate={seenDate} updateScreen={updateScreen} />
      ) : (
        <NoInternetError
          about={about}
          ancestors={ancestors}
          commonName={commonName}
          error={error}
          fetchiNatData={fetchiNatData}
          id={id}
          region={region}
          seenDate={seenDate}
          stats={stats}
          timesSeen={timesSeen}
          wikiUrl={wikiUrl}
        />
      )}
    </ScrollView>
  );
};

export default SpeciesDetail;