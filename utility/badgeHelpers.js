import AsyncStorage from "@react-native-community/async-storage";

const Realm = require( "realm" );

const realmConfig = require( "../models/index" );
const badgesDict = require( "./badgesDict" );

const recalculateBadges = () => {
  Realm.open( realmConfig.default )
    .then( ( realm ) => {
      const collectedTaxa = realm.objects( "TaxonRealm" );

      const unearnedBadges = realm.objects( "BadgeRealm" ).filtered( "earned == false" );

      unearnedBadges.forEach( ( badge ) => {
        if ( badge.iconicTaxonId !== 0 && badge.count !== 0 ) {
          const collectionLength = collectedTaxa.filtered( `iconicTaxonId == ${badge.iconicTaxonId}` ).length;

          if ( collectionLength >= badge.count ) {
            realm.write( () => {
              badge.earned = true;
              badge.earnedDate = new Date();
            } );
          }
        } else if ( badge.count !== 0 ) {
          if ( collectedTaxa.length >= badge.count ) {
            realm.write( () => {
              badge.earned = true;
              badge.earnedDate = new Date();
            } );
          }
        }
      } );
    } ).catch( ( err ) => {
      console.log( "[DEBUG] Failed to open realm in recalculate badges, error: ", err );
    } );
};

const deleteBadges = () => {
  Realm.open( realmConfig.default )
    .then( ( realm ) => {
      const collectedTaxa = realm.objects( "TaxonRealm" );
      const earnedBadges = realm.objects( "BadgeRealm" ).filtered( "earned == true" );

      earnedBadges.forEach( ( badge ) => {
        if ( badge.iconicTaxonId !== 0 && badge.count !== 0 ) {
          const collectionLength = collectedTaxa.filtered( `iconicTaxonId == ${badge.iconicTaxonId}` ).length;

          if ( collectionLength < badge.count ) {
            realm.write( () => {
              badge.earned = false;
              badge.earnedDate = null;
            } );
          }
        } else if ( badge.count !== 0 ) {
          if ( collectedTaxa.length < badge.count ) {
            realm.write( () => {
              badge.earned = false;
              badge.earnedDate = null;
            } );
          }
        }
      } );
    } ).catch( ( err ) => {
      console.log( "[DEBUG] Failed to delete badges, error: ", err );
    } );
};

const setupBadges = () => {
  Realm.open( realmConfig.default )
    .then( ( realm ) => {
      realm.write( () => {
        const dict = Object.keys( badgesDict.default );
        dict.forEach( ( badgeType ) => {
          const badges = badgesDict.default[badgeType];

          try {
            const badge = realm.create( "BadgeRealm", {
              name: badges.name,
              intlName: badges.intlName,
              iconicTaxonName: badges.iconicTaxonName,
              iconicTaxonId: badges.iconicTaxonId,
              count: badges.count,
              earnedIconName: badges.earnedIconName,
              unearnedIconName: badges.unearnedIconName,
              infoText: badges.infoText,
              index: badges.index,
              earned: badges.earned
            }, true );
          } catch ( e ) {
            // console.log( "error creating data", e );
          }
        } );
      } );
    } ).catch( ( err ) => {
      // console.log( "[DEBUG] Failed to setup badges, error: ", JSON.stringify( err ) );
    } );
};

const setBadgesEarned = ( badges ) => {
  AsyncStorage.setItem( "badgesEarned", badges );
};

const checkNumberOfBadgesEarned = () => {
  Realm.open( realmConfig.default )
    .then( ( realm ) => {
      const earnedBadges = realm.objects( "BadgeRealm" ).filtered( "earned == true AND iconicTaxonName != null" ).length;
      setBadgesEarned( earnedBadges.toString() );
      recalculateBadges();
    } ).catch( ( e ) => {
      console.log( e, "error checking number of badges earned" );
    } );
};

const getBadgesEarned = async () => {
  try {
    const earned = await AsyncStorage.getItem( "badgesEarned" );
    return earned;
  } catch ( error ) {
    return ( error );
  }
};

const checkForNewBadges = async () => {
  const badgesEarned = await getBadgesEarned();

  return (
    new Promise( ( resolve ) => {
      Realm.open( realmConfig.default )
        .then( ( realm ) => {
          let latestBadge;
          let latestLevel;

          const earnedBadges = realm.objects( "BadgeRealm" ).filtered( "earned == true AND iconicTaxonName != null" );
          const badges = earnedBadges.sorted( "earnedDate", true );

          const speciesCount = realm.objects( "TaxonRealm" ).length;
          const newestLevels = realm.objects( "BadgeRealm" )
            .filtered( "earned == true AND iconicTaxonName == null" )
            .sorted( "earnedDate", true );

          if ( badgesEarned < earnedBadges.length ) {
            latestBadge = badges[0];
          }

          if ( speciesCount === newestLevels[0].count && speciesCount !== 0 ) {
            latestLevel = newestLevels[0];
          }

          resolve( {
            latestBadge,
            latestLevel
          } );
        } ).catch( () => {
          resolve( null );
        } );
    } )
  );
};

export {
  recalculateBadges,
  setupBadges,
  checkNumberOfBadgesEarned,
  checkForNewBadges,
  getBadgesEarned,
  deleteBadges
};
