// @flow

import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import { FlatList, View, Platform } from "react-native";
import Realm from "realm";
import { useNavigation } from "@react-navigation/native";

import styles from "../../styles/notifications";
import NotificationCard from "./NotificationCard";
import realmConfig from "../../models";
import EmptyState from "../UIComponents/EmptyState";
import Padding from "../UIComponents/Padding";
import BottomSpacer from "../UIComponents/BottomSpacer";
import { markNotificationsAsViewed } from "../../utility/notificationHelpers";
import ViewWithHeader from "../UIComponents/Screens/ViewWithHeader";

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const scrollView = useRef( null );
  const [notifications, setNotifications] = useState( [] );

  const fetchNotifications = useCallback( () => {
    Realm.open( realmConfig ).then( ( realm ) => {
      const notificationList = realm.objects( "NotificationRealm" ).sorted( "index", true );
      setNotifications( notificationList );
    } ).catch( () => {
      // console.log( "[DEBUG] Failed to open realm, error: ", err );
    } );
  }, [] );

  useEffect( () => {
    const scrollToTop = () => {
      if ( scrollView && scrollView.current !== null ) {
        scrollView.current.scrollToOffset( {
          offset: 0, animated: Platform.OS === "android"
        } );
      }
    };

    navigation.addListener( "focus", () => {
      markNotificationsAsViewed();
      fetchNotifications();
      scrollToTop();
    } );
  }, [fetchNotifications, navigation] );

  return (
    <ViewWithHeader header="notifications.header">
      <FlatList
        ref={scrollView}
        contentContainerStyle={[styles.containerWhite, styles.flexGrow]}
        data={notifications}
        keyExtractor={( item, i ) => `${item}${i}`}
        ListFooterComponent={() => (
          <>
            <Padding />
            <BottomSpacer />
          </>
        )}
        renderItem={( { item } ) => <NotificationCard item={item} />}
        ListEmptyComponent={() => <EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </ViewWithHeader>
  );
};

export default NotificationsScreen;
