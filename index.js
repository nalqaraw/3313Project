const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const chatApp = express();
const server = http.createServer(chatApp);
const io = new Server(server);

chatApp.use(express.static("clients"));

// Global variables to hold all guest names and chatRooms created
var guests = {};
var chatRooms = [
  { name: "main", creator: " " },
  { name: "Room 2", creator: " " },
  { name: "Room 3", creator: " " },
];

io.on("joining", socket => {

  socket.on("createUser", username =>{
    socket.username = username;
    guests[username] = username;
    socket.currentRoom = "main";
    socket.join("main");

    socket.emit("updateChat", "INFO", "You have joined main room");
    socket.broadcast
      .to("main")
      .emit("updateChat", "INFO", username + " has joined the main room");
    io.sockets.emit("updateUsers", guests);
    socket.emit("updateRooms", chatRooms, "main");
  });

  socket.on("sendMessage", data => {
    io.sockets.to(socket.currentRoom).emit("updateChat", socket.username, data);
  });

  socket.on("createRoom", chatRooms=> {
    if (chatRooms != null) {
        chatRooms.push({ name: chatRooms, creator: socket.username});
      io.sockets.emit("updateRooms", chatRooms, null);
    }
  });

  socket.on("updateRooms", room => {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", socket.username + " has left the room");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    socket.emit("updateChat", "INFO", "Hello! You have joined the " + room + " room");
    socket.broadcast
      .to(room)
      .emit(
        "updateChat",
        "INFO",
        socket.username + " has joined " + room + " room"
      );
  });

  socket.on("disconnect",  ()=> {
    delete guests[socket.username];
    io.sockets.emit("updateUsers", guests);
    socket.broadcast.emit(
      "updateChat",
      "INFO",
      socket.username + " disconnected"
    );
  });
});

server.listen(80, ()=> {
  console.log("Listening to port 80.");
});