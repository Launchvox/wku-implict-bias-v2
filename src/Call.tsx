import React, { useState,useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './Call.css';

interface IAuth {
  uid: string;
  token: string;
}

const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });
/*async function getToken(channel:string): Promise<any> 
{
let result : IAuth = {token:"",uid:""};

  const request: RequestInit = { method:'GET', mode: 'cors', redirect: 'follow', headers: new Headers({
    'Authorization':'fhWJWc2gwn088XxmsJCAgoDn'})};
    // WARNING: Currently using token-free API.
    const res = await (fetch('https://v1r7dh4ice.execute-api.us-east-1.amazonaws.com/prod/api/token?channels='+channel, request))
  .catch((error) => {
    console.error("Error Getting Token:"+ error);
   });
  if(res instanceof Response)
  {
    let answer = await res.json();
  if (!res.ok){
      return result;
  }
  for (let i in answer.channels) {
    result.token = answer.channels[i];
    result.uid = answer.uid;
 }
return result;
  }
else
    return result;
}*/

//Added to allow for passing of app ID token and channel
function findGetParameter(parameterName : string) : string{
  var result = '',
      tmp = [];
      window.location.search
      .substr(1)
      .split("&")
      .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
      });
  return result;
}

function DeprecatedCall(props) {
  const appid = "7e6df1173bb44ad3bedd070112748cf6";
  const {
    localAudioTrack, //localVideoTrack, 
    joinState, joinInProgress, aiDenoiserState,leave, join, controler, remoteUsers
  } = useAgora(client);

  return (
    <div className='call'>
      <form className='call-form'>
        <div className='button-group'>
          <button id='Audio Channel' type='button' className='btn btn-primary btn-sm voice-button' style={{display: !joinState ? 'inline' : 'none'}} onClick={async () => { 
           const codeFromQueryParameter = findGetParameter('code');
           // IB: When testing locally, we need to pass in the "test" channel ID for Agora testing.
           //Otherwise, use photonRoom var set in session storage.
           const accessCode =  sessionStorage.photonRoom!=='' && sessionStorage.photonRoom != null? sessionStorage.photonRoom : 'test';
            // IB: Pass in Random generated userID from parent.
            join(appid,accessCode, null,parseInt(props.userID));
            }}>Join Voice Channel</button>
          <button id='leave' type='button' className='btn btn-primary btn-sm voice-button' style={{display: joinState ? 'inline' : 'none',color:'#5abaf9'}} onClick={() => {leave()}}>Leave Voice Channel</button>
        </div>
      </form>
      {/*Hidden to avoid taking extra UI space, as video will not be part of our call*/}
      <div className='player-container' style={{display:'none'}} > 
        <div className='local-player-wrapper' >
        </div>
        {remoteUsers.map(user => (<div className='remote-player-wrapper' key={user.uid}>
            <p className='remote-player-text'>{`remoteVideo(${user.uid})`}</p>
            <MediaPlayer videoTrack={undefined/*<div>user.videoTrack*/} audioTrack={user.audioTrack}></MediaPlayer>
          </div>))}
      </div>
    </div>
  );
}

export default DeprecatedCall;
