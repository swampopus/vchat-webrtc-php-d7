
// Global vars
var answer = 0;
var pc=null
var localStream=null;
var ws=null;
var localVideo = null;
var remoteVideo = null;
var configuration = null;
var lastSent = '';
var sentClientCandidate = false;
var lastReceived = '';
var chat_room_id = 'abc123xyz';  // DEV:  in prod this would be figured out somewhere else
var boolSetIceCandidateForLocalStream = false;

var currentConnectionState = "";

var isHost = false;

// This is Drupal-specific, and it just means that this code should run when the page
// has finished loading.  It's analogous to document.ready().
Drupal.behaviors.vchatStarup = {
  attach: function (context) {
    
    
    localVideo = document.getElementById('local-video');
    remoteVideo = document.getElementById('remote-video');
    
    if (Drupal.settings.vchat_is_host == true) {
      isHost = true;
    }
    
    
    
    configuration  = {
        'iceServers': [
          { 'urls': 'stun:stun.stunprotocol.org:3478' },
          { 'urls': 'stun:stun.l.google.com:19302' }          
        ]
    };    
    
    // Get our local media devices (audio + video) as "myStream"
    const constraints = {
        'video' : true,
        'audio' : true
    };
    navigator.mediaDevices.getUserMedia(constraints).then( stream => {
        console.log('Got MediaStream: ', stream);
        localVideo.srcObject = stream;
        localStream = stream;
    }).catch (error => {
        console.error('Error accessing media devices.', error);
    });
    
    
    // Create a websocket hack by creating a new "event source", then adding functions to it as if it were a websocket.
    try {
      ws = new EventSource(Drupal.settings.basePath + "vchat-get-eventsource");
      console.log("Got eventsource:", ws);
      
      // Now, we're going to create a function called "send" for our ws (websocket hack) which
      // actually uses ajax to communicate back to the PHP.
      ws.send = function send(message) {
        console.log("Sending via ajax: ", message);
        jQuery.post(Drupal.settings.basePath + "vchat-ajax-send-message", {"msg" : message},
            function (data) {
              // Success function.
              console.log("Succssfully sent message:", message);
              console.log("Got back from server:", data);
            });
      };
      
      
      // Websocket-hack: Add onmessage function
      ws.onmessage = function(e) {      
        // We have a message waiting for us, so process it.
        onsinglemessage(e.data);
      };
      
      jQuery(localVideo).on("loadedmetadata", function () {
        vchatPublish('client-call', null);
      });
      
    } catch (e) {
      console.error("Could not create eventsource.", e);
    }
    
    
    


    
    
    
    
  }
};





function vchatPublish(event, data) {
  
 
  
  lastSent = event;
  
  console.log("sending ws.send: " , event);  
  ws.send(JSON.stringify({
      chat_room_id:chat_room_id,
      event:event,
      data:data
  }));
} // vchatPublish






/*
 * We have received a message.  Respond accordingly.
 */
function onsinglemessage(data) {
  var package = JSON.parse(data);
  var data = package.data;
  
    
  console.log("received single message: ", package.event, data);
  
  if (package.event == 'client-call') {

    icecandidate(localStream);    
    
    pc.createOffer({
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1
    }).then(function (desc) {
        pc.setLocalDescription(desc).then(
          function () {
              vchatPublish('client-offer', pc.localDescription);
          }
        ).catch(function (e) {
          console.log("Problem with publishing client offer: "+e);
          return;
        });
    }).catch(function (e) {
        console.log("Problem while doing client-call: "+e);
        return;

    });
    

    
  } // client-call
  
  
  
  if (package.event == 'client-answer') {
    if (pc == null) {
      console.error('Before processing the client-answer, I need a client-offer');
      return;
    }
    pc.setRemoteDescription(new RTCSessionDescription(data),function(){}, 
      function(e) { 
        console.log("Problem while doing client-answer: ",e);
        return;
    });
  } // client-answer
  
  
  
  if (package.event == 'client-offer') {
    icecandidate(localStream);    
    pc.setRemoteDescription(new RTCSessionDescription(data), function(){
        if (!answer) {
          pc.createAnswer(function (desc) {
            pc.setLocalDescription(desc, function () {
              vchatPublish('client-answer', pc.localDescription);
            }, function(e){
              console.log("Problem getting client answer: ",e);
              return;

            });
          }
          ,function(e){
            console.log("Problem while doing client-offer: ",e);
            return;

          });
          answer = 1;
        }
    }, function(e){
         console.log("Problem while doing client-offer2: ",e);
         return;
    });
    
  } // client-offer
  
  
  
  if (package.event == 'client-candidate') {
      
    if (pc == null) {
      console.error('Before processing the client-answer, I need a client-offer');
      return;
    }
    
    pc.addIceCandidate(new RTCIceCandidate(data), function(){}, 
      function(e) { 
        console.log("Problem adding ice candidate: "+e);
        return;
    
      }
    );
        
  } // client-candidate
  
  
} // function onsinglemessage






function icecandidate(localStream) {
  
  if (boolSetIceCandidateForLocalStream) {
    console.log("Already set ice candidate for local stream. Returning.");
    return;
  }
  
  pc = new RTCPeerConnection(configuration);
  
  pc.onicecandidate = function (evt) {
    if (evt.candidate) {
      vchatPublish('client-candidate', evt.candidate);
    }
  };
  
  
  pc.onconnectionstatechange = function (evt) {
    
    switch (pc.connectionState) {
      case "new":
      case "connecting":
        console.log("Connecting....");
        currentConnectionState = "connecting";
        break;
      case "connected":
        console.log("Connected....");
        currentConnectionState = "connected";
        break;
      case "disconnected":
        console.log("Disconnected.");
        currentConnectionState = "disconnected";
        remoteVideo.srcObject = null;
        break;
      case "closed":
        console.log('Offline (closed)');
        currentConnectionState = "closed";
        remoteVideo.srcObject = null;
        break;
      case "failed":
        console.log('Error (failed)');
        currentConnectionState = "failed";
        remoteVideo.srcObject = null;
        break;
      default:
        console.log('Unknown connection state');
        currentConnectionState = "";
        break;
    }    
  };
  
  
  
  
  
  try {
    pc.addStream(localStream);
  }catch(e){
    var tracks = localStream.getTracks();
    for(var i=0;i<tracks.length;i++){
      pc.addTrack(tracks[i], localStream);
    }
  }
  
  pc.ontrack = function (e) {
    console.log("Trying to add stream to remoteVideo");
    remoteVideo.srcObject = e.streams[0];
  };
  
  boolSetIceCandidateForLocalStream = true;
  
} // icecandidate











