const socket = io('/');
// we are passing in undefined because we will let the server generate it's own ID for each new connection
const myPeer = new Peer(undefined, {
    host: '/',
    port: 3001
});

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true // mutes our own audio just for ourselves

const chatForm = document.getElementById('chat-form');

const peers = {}

//console.log(videoGrid);

/*
    HANDLING USER CONNECTIONS
*/

var getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;

getUserMedia({
    // we want to get out audio and video to send to other people
    video: true,
    audio: true,     
}).then(stream => {
    //console.log(stream)
    addVideoStream(myVideo, stream);

    // listening to when someone tries to call us and send them out current stream
    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        })
    })

    socket.on('user-connected', (userID, username) => {
        // user is joining
        // sending our video stream to the person we are trying to connect to
        setTimeout(() => {
            connectToNewUser(userID, stream);
        }, 3000);
    })
    //socket.emit('participants')
})

socket.on('user-disconnected', (userID, username) => {
    if(peers[userID]){
        peers[userID].close();
    }
})

//on open means that as soon as we connect to out peer server and get back an ID, we want to run this code 
myPeer.on('open', id => {
    // ROOM_ID is defined in the ejs file
    // giving back ROOM_ID to be accessed in the server
    // id is the user id that myPeer generates whenever a new user logs in
    socket.emit('join-room', ROOM_ID, id, USERNAME);
});


function connectToNewUser(userID, stream){
    // calls the user that we give the certain ID to and sending them out audio and stream
    const call = myPeer.call(userID, stream);
    const video = document.createElement('video');
    // taking the stream from the other user and adding it to out videoGrid
    call.on('stream', userVideoStream => {
        //console.log(userVideoStream);
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[userID] = call;
}

function addVideoStream(video, stream){
    // this wil allows us to play our video
    video.srcObject = stream;
    // this basically means, when the video is loaded on our page, we want it to play
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}


/*
    PARTICIPANTS LIST
*/


socket.on('participants-list', users => {
    const lists = document.getElementById('users-list');
    lists.innerHTML = "";
    lists.textContent = "";

    users.forEach(user => {
        const list = document.createElement('li');
        list.innerHTML = user.name
        lists.append(list)
    })
})


/*
    HANDLING CHAT MESSAGES
*/


// when the form is submitted, we receive the message and send it back to the server
chatForm.addEventListener('submit', event => {

    event.preventDefault();
    const message = event.target.elements.message.value;
    socket.emit('chatMessage', message);

    //clearing input text
    event.target.elements.message.value = "";
    event.target.elements.message.focus();
});

socket.on('message', (username, message) => {
    console.log(username);
    outputMessage(username, message);
})

function outputMessage(username, message){
    const messageList = document.querySelector('.message-text');
    const newMessage = document.createElement('li');
    newMessage.innerHTML = `${username}: ${message}`;
    messageList.append(newMessage);
}