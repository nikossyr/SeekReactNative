// @flow
import Realm from "realm";
import inatjs, { FileUpload } from "inaturalistjs";

import realmConfig from "../models/index";
import createUserAgent from "../utility/userAgent";
import { resizeImage } from "./photoHelpers";

const saveIdAndUploadStatus = async ( id: number, uri: string, uuid: string ) => {
  const realm = await Realm.open( realmConfig );
  try {
    realm.write( ( ) => {
      realm.create( "UploadPhotoRealm", {
        id,
        uri,
        uploadSucceeded: false,
        uuid
      }, true );
    } );
  } catch ( e ) {
    console.log( "couldn't save id and upload status to UploadPhotoRealm", e );
  }
};

const saveUploadSucceeded = async ( id: number ) => {
  const realm = await Realm.open( realmConfig );
  const observation = realm.objects( "UploadPhotoRealm" ).filtered( `id == ${id}` )[0];

  try {
    realm.write( ( ) => {
      observation.uploadSucceeded = true;
    } );
  } catch ( e ) {
    console.log( "couldn't set succeeded status: ", e );
  }
};

const resizeImageForUpload = async ( uri: string ) => {
  return await resizeImage( uri, 2048 );
};

const fetchJSONWebToken = async ( loginToken: string ) => {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": createUserAgent( ),
    "Authorization": `Bearer ${loginToken}`
  };

  const site = "https://www.inaturalist.org";

  try {
    const r = await fetch( `${site}/users/api_token`, { headers } );
    const parsedResponse = await r.json( );
    return parsedResponse.api_token;
  } catch ( e ) {
    return null;
  }
};

const appendPhotoToObservation = async ( id: number, token: string, uri: string, uuid: string ) => {
  const photoParams = {
    "observation_photo[observation_id]": id,
    "observation_photo[uuid]": uuid,
    file: new FileUpload( {
      uri,
      name: "photo.jpeg",
      type: "image/jpeg"
    } )
  };

  const options = { api_token: token, user_agent: createUserAgent( ) };

  try {
    await inatjs.observation_photos.create( photoParams, options );
    return true;
  } catch ( e ) {
    return false;
  }
};

const uploadPhoto = async ( uri: string, id: number, token: string, uuid: string ) => {
  const resizedPhoto = await resizeImageForUpload( uri );
  const reUpload = await appendPhotoToObservation( id, token, resizedPhoto, uuid );

  if ( reUpload === true ) {
    saveUploadSucceeded( id );
    return true;
  }
  return false;
};

const checkForIncompleteUploads = async ( login: string ) => {
  const realm = await Realm.open( realmConfig );
  try {
    const uploads = realm.objects( "UploadPhotoRealm" );
    const unsuccessfulUploads = uploads.filtered( "uploadSucceeded == false" );

    if ( unsuccessfulUploads.length === 0 ) { return; }

    const token = await fetchJSONWebToken( login );
    if ( token === null ) { return; }

    unsuccessfulUploads.forEach( ( photo ) => {
      uploadPhoto( photo.uri, photo.id, token, photo.uuid );
    } );
  } catch ( e ) {
    console.log( e, " : couldn't check for incomplete uploads" );
  }
};

export {
  saveIdAndUploadStatus,
  saveUploadSucceeded,
  checkForIncompleteUploads,
  resizeImageForUpload,
  fetchJSONWebToken
};
