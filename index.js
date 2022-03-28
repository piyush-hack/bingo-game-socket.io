const express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var path = require('path');


const app = express();
const port = process.env.PORT || 5000;
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/')));


let rooms = {};
let roomDetails = {};
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// app.get('/room/:roomName', (req, res) => {
//     console.log(req.params)
//     const newRoom = req.params.roomName
//     // rooms[newRoom] = rooms[newRoom] != undefined ? ++rooms[newRoom] : 1;

//     console.log(rooms , roomDetails)
//     res.sendFile(__dirname + '/index.html');
// });

io.on("connection", async (socket) => {
    // console.log("a user connected");
    socket.emit("connected", { msg: "Connection Started" });

    socket.on("joinRoom", async function (data) {
        if (
            roomDetails[data.room] &&
            roomDetails[data.room]["userId"].filter(e => e ? e.userId === data.userId : false).length > 0
        ) {
            socket.emit("error", { msg: "This Name Is Taken", type: "takenuserId" });
            return;
        }

        if (socket.rooms.has(data.room)) {
            socket.emit("error", {
                msg: "You Are Already In The Room",
                type: "alreadyInRoom",
            });
            return;
        }

        socket.join(data.room);
        let newRoom = data.room;
        if (roomDetails[newRoom] == undefined) {
            // console.log("Enterd")
            roomDetails[newRoom] = { users: 1, gameStatus: false };
            roomDetails[newRoom]["userId"] = [];
            let newuserId = {};
            newuserId[socket.id] = data.userId;
            newuserId = { socketId: socket.id, userId: data.userId, turn: true };
            roomDetails[newRoom].userId.push(newuserId);
            rooms[newRoom] = 1;
            io.to(socket.id).emit("turn", { turn: true, msg: "Wait For Others", gameStatus: roomDetails[newRoom]["gameStatus"] });
            io.in(newRoom).emit("showTurn", {
                userId: roomDetails[newRoom].userId,
                msg: "You're First One In The Room",
                gameStatus: roomDetails[newRoom]["gameStatus"]

            });
        } else {
            if (roomDetails[newRoom].users) {
                ++roomDetails[newRoom].users;
                let newuserId = {};
                newuserId = { socketId: socket.id, userId: data.userId };
                roomDetails[newRoom].userId.push(newuserId);
                ++rooms[newRoom];
                io.in(newRoom).emit("showTurn", {
                    userId: roomDetails[newRoom].userId,
                    msg: data.userId + " Have Joined",
                    gameStatus: roomDetails[newRoom]["gameStatus"]
                });
            } else {
                roomDetails[newRoom].users = 1;
                roomDetails[newRoom]["userId"] = [];
                let newuserId = {};
                newuserId = { socketId: socket.id, userId: data.userId, turn: true };
                roomDetails[newRoom].userId.push(newuserId);
                rooms[newRoom] = 1;
                io.to(socket.id).emit("turn", {
                    turn: true,
                    msg: "Wait For Others",
                    gameStatus: roomDetails[newRoom]["gameStatus"]
                });
                io.in(newRoom).emit("showTurn", {
                    userId: roomDetails[newRoom].userId,
                    msg: "You're First One In The Room",
                    gameStatus: roomDetails[newRoom]["gameStatus"]

                });
            }
        }
        socket.emit("joinSuccess", { joined: true });
        // console.log(rooms, JSON.stringify(roomDetails));
    });

    socket.on("startGame", function (data) {

        var x = [...socket.rooms][1];
        roomDetails[x]["gameStatus"] = true;
        io.in(x).emit("startGameForAll", { msg: "Start game For All" });
    })

    socket.on("nextTurn", function (data) {
        var x = [...socket.rooms][1];
        io.in(x).emit("doCross", { cross: data.cross });

        // console.log(x)
        let index = roomDetails[x]["userId"].findIndex((p) =>
            p ? p.socketId == socket.id : false
        );
        if (roomDetails[x]["userId"][index]["turn"]) {
            let newTurnIndex = -1;
            if (roomDetails[x]["userId"].length - 1 > index && roomDetails[x]["userId"].length != 1) {
                newTurnIndex = roomDetails[x]["userId"]
                    .slice(index)
                    .findIndex((p) => p && !p.turn);
                newTurnIndex += index;
            } else {
                newTurnIndex = roomDetails[x]["userId"].findIndex((p) => p && !p.turn);
            }

            roomDetails[x]["userId"][index]["turn"] = false;
            if (rooms[x] == 1) {
                newTurnIndex = index;
            }
            if (newTurnIndex != -1) {
                roomDetails[x]["userId"][newTurnIndex]["turn"] = true;
                io.to(roomDetails[x]["userId"][newTurnIndex]["socketId"]).emit("turn", {
                    turn: true,
                    msg: roomDetails[x]["userId"][index] + "Played! Its Your Turn Now",
                });
                io.in(x).emit("showTurn", {
                    userId: roomDetails[x].userId,
                    msg: roomDetails[x]["userId"][newTurnIndex]["userId"] + " User Chance!",
                });
            }
        }

        // console.log(rooms, JSON.stringify(roomDetails));
    });

    socket.on("win" , function(data){
        var x = [...socket.rooms][1];
        let index = roomDetails[x]["userId"].findIndex((p) =>
            p ? p.socketId == socket.id : false
        );
        // console.log("Won" , index , roomDetails[x]["userId"][index]["userId"])
        io.in(x).emit("gameResults" , { winner : roomDetails[x]["userId"][index]["userId"] })
        // roomDetails[x]["gameStatus"] = true;
    })

    socket.on("disconnecting", function () {
        // console.log("Removing");

        for (const x of socket.rooms.values()) {
            // console.log(x);
            if (roomDetails[x]) {
                socket.leave(x);

                io.in(x).emit("userLeft", { msg: "A User Has Left" });
                // console.log(roomDetails[x].users);
                let index = roomDetails[x]["userId"].findIndex((p) =>
                    p ? p.socketId == socket.id : false
                );
                if (roomDetails[x]["userId"][index]["turn"]) {
                    let newTurnIndex = -1;
                    if (roomDetails[x]["userId"].length - 1 > index) {
                        newTurnIndex = roomDetails[x]["userId"]
                            .slice(index)
                            .findIndex((p) => p && !p.turn);
                        if (newTurnIndex != -1) {
                            newTurnIndex += index;
                        }
                    } else {
                        newTurnIndex = roomDetails[x]["userId"].findIndex(
                            (p) => p && !p.turn
                        );
                    }
                    // let newTurnIndex = roomDetails[x]["userId"].findIndex(p => p && !p.turn);
                    if (newTurnIndex != -1) {
                        roomDetails[x]["userId"][newTurnIndex]["turn"] = true;
                        io.to(roomDetails[x]["userId"][newTurnIndex]["socketId"]).emit(
                            "turn",
                            {
                                turn: true,
                                msg:
                                    roomDetails[x]["userId"][index]["userId"] +
                                    " User Has Left! Its Your Turn",
                                gameStatus: roomDetails[x]["gameStatus"]

                            }
                        );

                    }
                }

                let leftUser = roomDetails[x]["userId"][index]["userId"];
                roomDetails[x]["userId"][index] = undefined;
                io.in(x).emit("showTurn", {
                    userId: roomDetails[x].userId,
                    msg: leftUser + " User Has Left",
                    gameStatus: roomDetails[x]["gameStatus"]
                });
                roomDetails[x]["userId"][index] = undefined;

                if (roomDetails[x].users > 1  || roomDetails[x]["userId"].every(element => element === null)) {
                    // console.log("Removing")
                    --roomDetails[x].users;
                    --rooms[x];
                } else {
                    delete roomDetails[x];
                    delete rooms[x];
                }
            }
        }

        // console.log(rooms, JSON.stringify(roomDetails));
    });

    socket.on("disconnect", () => {
        // console.log("user disconnected");
    });
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
