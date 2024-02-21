import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';

let localTracks = {audioTrack: undefined };
//let localTracks = { videoTrack: undefined, audioTrack: undefined };

export default function useAgora(client: IAgoraRTCClient | undefined)
  :
   {
      localAudioTrack: ILocalAudioTrack | undefined ,
      //localVideoTrack: ILocalVideoTrack | undefined ,
      joinState: boolean,
      joinInProgress: boolean,
      aiDenoiserState: boolean,
      leave: Function,
      join: Function,
      controler: Function,
      remoteUsers: IAgoraRTCRemoteUser[],
    }
    {
  //const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | undefined>(undefined);

  const [joinState, setJoinState] = useState(false);

  const [joinInProgress, setJoinInProgressState] = useState(false);

  const [aiDenoiserState, setAIDenoiser] = useState(false);


  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  let options = { appid: null, channel: null, uid: null, token: null };

  //Call continuslly with early exit
  async function join(appid: string, channel: string, token?: string, uid?: string | number | null) {

    //Allow single channel only
    if (!client || joinState || joinInProgress) return;

    setJoinInProgressState(true);
    // let microphoneAudioTrack = await AgoraRTC.createMicrophoneAudioTrack() ;

    // let cameraVideoTrack = await AgoraRTC.createCameraVideoTrack();

    // localTracks = { videoTrack: cameraVideoTrack, audioTrack: microphoneAudioTrack };

    // await client.join(appid, channel, token || null);

    // @ts-ignore
    [options.uid, localTracks.audioTrack] = await Promise.all([
      //IB: Added uid to allow for selecting id for each client that joins manually.
      client.join(appid, channel, token, uid),
      // IB: End
      AgoraRTC.createMicrophoneAudioTrack(),
      //AgoraRTC.createCameraVideoTrack(),
    ]);

    setLocalAudioTrack(localTracks.audioTrack);
    //setLocalVideoTrack(localTracks.videoTrack);
    
    // @ts-ignore
    await client.publish(Object.values(localTracks));

    (window as any).client = client;
    //(window as any).videoTrack = localTracks.videoTrack;

    setJoinState(true);
    setJoinInProgressState(false);
  }

  async function leave() {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
   // if (localVideoTrack) {
   //   localVideoTrack.stop();
   //   localVideoTrack.close();
   // }
    setRemoteUsers([]);
    setJoinState(false);
    await client?.leave();
  }

  async function controler(flag: boolean){
    //await enableDenoiser4AudioTrack?.controler(flag);
    //console.log("execute controler function with flag: " + flag);
  }




  useEffect(() => {
    if (!client) return;
    setRemoteUsers(client.remoteUsers);

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      // toggle rerender while state of remoteUsers changed.
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    };
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    };
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    };
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    };
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, [client]);

  return {
    localAudioTrack,
    //localVideoTrack,
    joinState,
    joinInProgress,
    aiDenoiserState,
    leave,
    join,
    controler,
    remoteUsers,
  };
}