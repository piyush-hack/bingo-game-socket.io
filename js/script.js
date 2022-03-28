
// var socket = io.connect('http://localhost:5000');
var socket = io.connect('https://bingo-fun-game.herokuapp.com');
// var socket = io.connect('https://bingo.piyushdev.xyz');
socket.on("connected", function (data) {
    console.log(data)
})

let url = window.location.href;
let loc = url.split("/")[3];
console.log(loc)
if (loc == "room") {
    document.getElementById("setUpBtn").click();
} else {
    document.getElementById("setUpBtn").click();
    // document.querySelector(".gameScreen").innerHTML= "";
}

document.getElementById("loginRoom").addEventListener("click", function () {
    var joinName = (document.getElementById("joinName").value).trim();
    var roomName = (document.getElementById("roomName").value).trim();
    if (roomName == "") {
        swal("Enter A Room Name!", "Enter The Room Name In Which Your Friends Are!", "error");
        return;
    }
    if (joinName == "") {
        swal("Enter A Unique Name To Join!", "To Join The Game In This Room You Need To Enter Unique Name", "error");
        return;
    } else {
        // swal("Wait We Are Connecting You!", "Please Give Us A Min!", "info");
        // swal({
        //     title: "Wait We Are Connecting You!!",
        //     text: "Please Give Us A Min!",
        //     type: "info",
        // });

        $(".loader").show();
        socket.emit("joinRoom", { msg: "Join Room", room: roomName, userId: joinName })
    }
})



socket.on("error", function (data) {
    if (data.type == "takenuserId") {
        console.log("Didn't Join  Room")
        swal(data.msg, "", "error");
        $(".loader").hide();
    }

    if (data.type == "alreadyInRoom") {
        console.log("You are already In The Room")
        alert(data.msg)
        $(".loader").hide();

    }
})


function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function splitArray(array, part) {
    var tmp = [];
    for (var i = 0; i < array.length; i += part) {
        tmp.push(array.slice(i, i + part));
    }
    return tmp;
}
const Matrix = function (matrix) { this.matrix = matrix; }

Matrix.prototype.getHorizontalSequences = function () {
    const matrix = this.matrix, sets = [];

    for (let i = 0; i < matrix.length; ++i) {
        const row = matrix[i];

        for (let j = 0; j < row.length; ++j) {
            const start = j;
            let k = j + 1;

            for (; k < row.length; ++k) {
                if (row[j] !== row[k]) break;
            }

            sets.push({ row: i, val: row[j], start: start, end: k - 1 });
            j = k - 1;
        }
    }

    return sets;
};

Matrix.prototype.getVerticalSequences = function () {
    const matrix = this.matrix, sets = [];

    for (let i = 0; i < matrix[0].length; ++i) {
        for (let j = 0; j < matrix.length; ++j) {
            const start = j;
            let k = j + 1;

            for (; k < matrix.length; ++k) {
                if (matrix[j][i] !== matrix[k][i]) break;
            }

            sets.push({ col: i, val: matrix[j][i], start: start, end: k - 1 });
            j = k - 1;
        }
    }

    return sets;
};

Matrix.prototype.getDiagonalSequences = function () {
    const matrix = this.matrix, sets = [];
    for (let i = 0; i < matrix[0].length; i++) {
        for (let j = i; j < matrix.length; j++) {
            const start = j;
            let k = j + 1;

            for (; k < matrix.length; k++) {
                if (matrix[j][i] !== (matrix[j + k] || [])[i + k]) break;
            }
            sets.push({ col: i, val: matrix[j][i], start: start, end: k });
            j = k - 1;
        }
    }

    return sets;
};

Matrix.prototype.getRightDiagonalSequences = function () {
    const matrix = this.matrix;
    const len = matrix.length - 1;
    sets = [];
    let allSame = true;
    for (let i = 0; i < matrix.length; i++) {
        const e = matrix[i][len - i];
        if (len - i - 1 >= 0 && matrix[i][len - i] !== matrix[i + 1][len - i - 1]) {
            allSame = false;
            break;
        }

        if (len - i - 1 < 0 && allSame === true) {
            sets.push({ col: 0, val: matrix[i][len - i], start: len - i, end: len });
        }
    }

    return sets;
}


const N = 25;
let bingoNums = Array.from({ length: N }, (_, index) => index + 1);
console.log(bingoNums);

// function randomIntFromInterval(min, max) { // min and max included 
//     return Math.floor(Math.random() * (max - min + 1) + min)
// }

// const rndInt = randomIntFromInterval(1, 25)

bingoNums = shuffle(bingoNums);


for (let i = 0; i < bingoNums.length; i++) {
    const e = bingoNums[i];
    let currBox = "square" + i;
    document.getElementById(currBox).textContent = e;
}

// let allTds = document.querySelectorAll(".bingoTd");
// for (let i = 0; i < allTds.length; i++) {
//     const td = allTds[i];
//     td.onclick = function () {
//         let temp = td.id
//         td.textContent = "X"
//         // console.log((td.id).slice(6,))
//         bingoNums[(td.id).slice(6,)] = -1;
//         checkStatus(temp);
//     }
// }

socket.on("joinSuccess", function (data) {
    if (data.joined == true) {
        $(".loader").hide();
        $("#openGameScreen").click();
    }
})

function startGame(startBtn) {
    socket.emit("startGame", { msg: "Start Game" });
    startBtn.remove();

}
socket.on("startGameForAll", function (data) {
    $("#bingotable").show();
})

socket.on("turn", function (data) {
    console.log("Your Turn", data.gameStatus);


    console.log("gameStatus", data.gameStatus)
    if (data.gameStatus == false) {
        $(".gameScreen").append(`<button id="startBtn" class="btn btn-sm btn-outline-dark btn-rounded" data-mdb-ripple-color="dark" onclick="startGame(this)" >START</button>`)
    }
    $(".bingoTd").on('click', function () {
        // console.log($(this).html(), this.id, turn)
        if ($(this).html() != "X") {
            let temp = $(this).html();
            socket.emit("nextTurn", { cross: temp });
        }
        $(".bingoTd").off('click');

    });

    $(".bingoTd").each(function () {
        if ($(this).html() == "X") {
            $(this).off('click')
        }
    })
})

socket.on("showTurn", function (data) {
    // console.log(data)
    if (data.gameStatus == true) {
        $("#bingotable").show();
    }

    let divHtml = "";
    for (const key in data.userId) {
        const element = data.userId[key];
        if (element) {


            divHtml += `<div class="user ${element.turn ? 'curr' : ''} ">${element.userId == (document.getElementById("joinName").value).trim() ? "You" : element.userId} ${data.gameStatus == false && element.turn == true ? ' - Will Start Game' : ''}</div>`
        }

    }
    console.log(divHtml, data.userId)

    document.getElementById("gameStatus").innerHTML = "<h3>Players</h3>" + divHtml;
})

socket.on("doCross", function (data) {
    $(".bingoTd").each(function () {
        if ($(this).html() === data.cross) {
            $(this).css("backgroundColor", "#30C731");
            $(this).css("color", "white");
            $(this).html("X");
            bingoNums[(this.id).slice(6,)] = -1;
            checkStatus(this.id);
        }
    })
})

socket.on("gameResults", function (data) {
    // swal("Hurray " + data.winner + "!", data.winner + " Have Won The game!", "success");
    socket.disconnect();
    swal("Hurray " + data.winner + "!", data.winner + " Have Won The game!", "success")
        .then((value) => {
            // window.location.href = window.location.href;
        });
})


async function checkStatus(temp) {
    let allCrosses = 0;
    let matrix = bingoNums;
    matrix = await splitArray(matrix, 5);
    matrix = new Matrix(matrix); // Reshape array in-place.
    allCrosses += (matrix.getHorizontalSequences().filter(e => (e.end + 1) - e.start >= 5)).length;
    allCrosses += (matrix.getVerticalSequences().filter(e => (e.end + 1) - e.start >= 5)).length;
    allCrosses += (matrix.getDiagonalSequences().filter(e => (e.end + 1) - e.start >= 5)).length;
    allCrosses += (matrix.getRightDiagonalSequences()).length;
    // console.log(matrix.getHorizontalSequences().filter(e => (e.end + 1) - e.start >= 5));
    // console.log(matrix.getVerticalSequences().filter(e => (e.end + 1) - e.start >= 5));
    // console.log(matrix.getDiagonalSequences().filter(e => (e.end + 1) - e.start >= 5));
    // console.log(matrix.getRightDiagonalSequences());
    console.log("allCrosses", allCrosses)
    if (allCrosses >= 5) {
        console.log("Won")
        socket.emit("win", { msg: "Game Won And Ended" })
    }
    socket.emit("choosed", { tdId: temp })
}

