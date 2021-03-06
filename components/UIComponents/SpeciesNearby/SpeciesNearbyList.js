// @flow

import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useRoute } from "@react-navigation/native";

import styles from "../../../styles/uiComponents/speciesNearby/speciesNearbyList";
import SpeciesImageCell from "./SpeciesImageCell";
import EmptyList from "./EmptyList";
import SpeciesObservedCell from "./SpeciesObservedCell";

type Props = {
  +taxa: Array<Object>
}

const SpeciesNearbyList = ( { taxa }: Props ) => {
  const { name } = useRoute();

  const getItemLayout = useCallback( ( data, index ) => (
    // skips measurement of dynamic content for faster loading
    {
      length: ( 28 + 108 ),
      offset: ( 28 + 108 ) * index,
      index
    }
  ), [] );

  const extractKey = useCallback( ( taxon, i ) => name === "ChallengeDetails" ? `observed-${i}` : `species-${taxon.id}`, [name] );

  const renderEmptyList = useCallback( () => <EmptyList />, [] );

  const renderSpecies = useCallback( ( { item } ) => {
    if ( name === "ChallengeDetails" ) {
      return <SpeciesObservedCell item={item} />;
    }
    return <SpeciesImageCell item={item} />;
  }, [name] );

  return (
    <FlatList
      alwaysBounceHorizontal
      bounces={taxa.length > 0}
      contentContainerStyle={taxa.length > 0 && styles.taxonList}
      data={taxa}
      getItemLayout={getItemLayout}
      horizontal
      initialNumToRender={3}
      keyExtractor={extractKey}
      ListEmptyComponent={renderEmptyList}
      renderItem={renderSpecies}
    />
  );
};

export default SpeciesNearbyList;
