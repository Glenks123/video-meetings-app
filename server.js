const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// generates the random room ID
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const users = {};

app.get('/', (req, res) => {
    res.redirect(`/room/${uuidV4()}`);
});

app.get('/room/:id', (req, res) => {
    const { id } = req.params;
    res.render('room', { roomID: id });
});

io.on('connection', socket => {
    socket.on('join-room', (roomID, userID, username) => {
        //console.log(roomID, username ,userID);
        // if there is already a roomID, push the newUser details there, else create a new roomID then add users to that room everytime
        if (users[roomID]){
            users[roomID].push({id: userID, name: username, video: true, audio: true})
        }else{
            users[roomID] = [{id: userID, name: username, video: true, audio: true}];
        }
        //console.log(users)

        socket.join(roomID);
        console.log(userID, username);
        // broadcasting to all the users except the person that someone has joined
        socket.broadcast.to(roomID).emit('user-connected', userID, username);

        io.in(roomID).emit('participants-list', users[roomID]);

        socket.on('chatMessage', message => {
            // getting the username of the person who has sent the message
             const userName = users[roomID].filter(user => user.id === userID)[0].name;
            // receives the message then sends back to client-side in order to visualize it
            io.in(roomID).emit('message', userName, message);
        });

        socket.on('disconnect', () => {
            socket.broadcast.to(roomID).emit('user-disconnected', userID, username);
            users[roomID] = users[roomID].filter(user => user.id !== userID);
            if (users[roomID].length === 0){
                delete users[roomID]
            }else{
                io.in(roomID).emit('participants-list', users[roomID])
            } 
        });
    });
});

server.listen(3000);