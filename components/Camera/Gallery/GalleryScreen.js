// @flow

import React, { useReducer, useEffect, useCallback } from "react";
import { Platform, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { checkCameraRollPermissions } from "../../../utility/androidHelpers.android";
import styles from "../../../styles/camera/gallery";
import GalleryHeader from "./GalleryHeader";
import GalleryImageList from "./GalleryImageList";
import CameraError from "../CameraError";
import { fetchGalleryPhotos } from "../../../utility/cameraRollHelpers";
import { colors } from "../../../styles/global";
import LoadingWheel from "../../UIComponents/LoadingWheel";

const GalleryScreen = () => {
  const navigation = useNavigation();
  // eslint-disable-next-line no-shadow
  const [state, dispatch] = useReducer( ( state, action ) => {
    switch ( action.type ) {
      case "SET_ALBUM":
        return {
          album: action.album,
          photos: [],
          error: null,
          hasNextPage: true,
          lastCursor: null,
          stillFetching: false,
          errorEvent: null,
          loading: true
        };
      case "FETCH_PHOTOS":
        return { ...state, stillFetching: true };
      case "APPEND_PHOTOS":
        return {
          ...state,
          photos: action.photos,
          stillFetching: false,
          hasNextPage: action.pageInfo.has_next_page,
          lastCursor: action.pageInfo.end_cursor,
          loading: false
        };
      case "ERROR":
        return {
          ...state,
          error:
          action.error,
          errorEvent: action.errorEvent,
          loading: false
        };
      default:
        throw new Error();
    }
  }, {
    album: null,
    photos: [],
    error: null,
    hasNextPage: true,
    lastCursor: null,
    stillFetching: false,
    errorEvent: null,
    loading: true
  } );

  const {
    album,
    photos,
    error,
    hasNextPage,
    lastCursor,
    stillFetching,
    errorEvent,
    loading
  } = state;

  const appendPhotos = useCallback( ( data, pageInfo ) => {
    if ( photos.length === 0 && data.length === 0 ) {
      // this is triggered in certain edge cases, like when iOS user has "selected albums"
      // permission but has not given Seek access to a single photo
      dispatch( { type: "ERROR", error: "photos", errorEvent: null } );
    } else {
      const updatedPhotos = photos.concat( data );
      dispatch( { type: "APPEND_PHOTOS", photos: updatedPhotos, pageInfo } );
    }
  }, [photos] );

  const fetchPhotos = useCallback( async ( ) => {
    if ( !hasNextPage || stillFetching ) { return; }
    dispatch( { type: "FETCH_PHOTOS" } );

    try {
      const results = await fetchGalleryPhotos( album, lastCursor );
      appendPhotos( results.edges, results.page_info );
    } catch ( e ) {
      if ( e.message === "Access to photo library was denied" ) {
        dispatch( { type: "ERROR", error: "gallery", errorEvent: null } );
      } else {
        dispatch( { type: "ERROR", error: "photos", errorEvent: e.message } );
      }
    }
  }, [album, lastCursor, appendPhotos, hasNextPage, stillFetching ] );

  const updateAlbum = useCallback( ( newAlbum: ?string ) => {
    // prevent user from reloading the same album twice
    if ( album === newAlbum ) { return; }
    dispatch( { type: "SET_ALBUM", album: newAlbum } );
  }, [album] );

  useEffect( () => {
    // this triggers on first load and when a user switches to a new album
    if ( photos.length === 0 ) {
      fetchPhotos();
    }
  }, [photos.length, fetchPhotos] );

  useEffect( () => {
    const requestAndroidPermissions = async () => {
      if ( Platform.OS === "android" ) {
        const permission = await checkCameraRollPermissions();
        if ( permission !== true ) {
          dispatch( { type: "ERROR", error: "gallery", errorEvent: null } );
        }
      }
    };

    navigation.addListener( "focus", () => { requestAndroidPermissions(); } );
  }, [navigation] );

  const renderImageList = ( ) => {
    if ( loading ) {
      return <LoadingWheel color={colors.darkGray} />;
    }

    if ( error ) {
      return <CameraError error={error} errorEvent={errorEvent} />;
    }

    return <GalleryImageList fetchPhotos={fetchPhotos} photos={photos} />;
  };

  return (
    <SafeAreaView style={styles.background} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <GalleryHeader updateAlbum={updateAlbum} />
      {renderImageList( )}
    </SafeAreaView>
  );
};

export default GalleryScreen;
