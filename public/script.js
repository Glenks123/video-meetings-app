const socket = io('/');
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

let getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;

getUserMedia({
    video: true,
    audio: true,     
}).then(stream => {
    //console.log(stream)
    addVideoStream(myVideo, stream);

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

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, USERNAME);
});


function connectToNewUser(userID, stream){
    // calls the user that we give the certain ID to and sending them out audio and stream
    const call = myPeer.call(userID, stream);
    const video = document.createElement('video');
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
    video.srcObject = stream;
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
