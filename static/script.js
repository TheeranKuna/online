document.addEventListener("DOMContentLoaded", () => {
    let mySymbol = null;
    let currentPlayer = "X";
    let gameActive = true;
    const socket = io();
    const cells = document.querySelectorAll(".cell");
    const statusText = document.getElementById("status");
    const restartButton = document.getElementById("restart");
    const lobby = document.getElementById("lobby");
    const playerInfo = document.getElementById("player-info");
    const playersDisplay = document.getElementById("players-display");
    const clickSound = new Audio("click.mp3");
    
    function cellClick(event) {
        if (!gameActive || mySymbol !== currentPlayer) return;
        let cell = event.target;
        if (cell.textContent === "") {
            clickSound.play();
            socket.emit("move", { cellId: cell.id, player: mySymbol });
        }
    }

    window.joinGame = () => {
        let username = document.getElementById("username").value.trim();
        if (username) {
            socket.emit("join_game", username);
            lobby.style.display = "none";
        }
    };

    socket.on("assign_player", (data) => {
        mySymbol = data.symbol;
        playersDisplay.textContent = `Player X: ${data.symbol === "X" ? data.username : "Waiting..."} vs. Player O: ${data.symbol === "O" ? data.username : "Waiting..."}`;
        playerInfo.style.display = "block";
    });
    

    socket.on("update_players", (data) => {
        playersDisplay.textContent = `Player X: ${data.X ? data.X.username : "Waiting..."} vs. Player O: ${data.O ? data.O.username : "Waiting..."}`;
    });
    
    

    socket.on("game_full", () => {
        statusText.textContent = "Game is full. Please try again later.";
    });

    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    function checkWinner() {
        for (let condition of winConditions) {
            let [a, b, c] = condition;
            if (
                cells[a].textContent &&
                cells[a].textContent === cells[b].textContent &&
                cells[a].textContent === cells[c].textContent
            ) {
                statusText.textContent = `Player ${cells[a].textContent} Wins! 🎉`;
                gameActive = false;
                return true;
            }
        }
        return false;
    }

    function checkDraw() {
        return [...cells].every(cell => cell.textContent !== "");
    }

    socket.on("update_board", (data) => {
        let cell = document.getElementById(data.cellId);
        if (cell.textContent === "") {
            cell.textContent = data.player;
            cell.classList.add("taken");

            if (checkWinner()) return;
            if (checkDraw()) {
                statusText.textContent = "It's a Draw! 🤝";
                gameActive = false;
                return;
            }
            currentPlayer = data.player === "X" ? "O" : "X";
            statusText.textContent = `Player ${currentPlayer}'s turn`;
        }
    });

    restartButton.addEventListener("click", () => {
        socket.emit("restart_game");
    });

    socket.on("restart", () => {
        cells.forEach(cell => {
            cell.textContent = "";
            cell.classList.remove("taken");
        });
        currentPlayer = "X";
        gameActive = true;
        statusText.textContent = "Player X's turn";
    });

    cells.forEach(cell => {
        cell.addEventListener("click", cellClick);
    });
});
