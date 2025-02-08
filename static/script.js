document.addEventListener("DOMContentLoaded", () => {
    let mySymbol = null; // Store the assigned player symbol (X or O)
    let currentPlayer = "X";
    const cells = document.querySelectorAll(".cell");
    const statusText = document.getElementById("status");
    const restartButton = document.getElementById("restart");
    let gameActive = true;
    const socket = io();

    // Receive player assignment from the server
    socket.on("assign_player", (symbol) => {
        mySymbol = symbol; // Assign player symbol
        statusText.textContent = `You are Player ${mySymbol}`;
    });

    // Show a "Game Full" message if a third player tries to join
    socket.on("game_full", () => {
        statusText.textContent = "Game is full. Please try again later.";
    });

    // Winning conditions
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
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

    function cellClick(event) {
        if (!gameActive || mySymbol !== currentPlayer) return; // Only allow the correct player to move
        let cell = event.target;
        if (cell.textContent === "") {
            socket.emit("move", { cellId: cell.id, player: mySymbol });
        }
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

    // Restart Game Logic
    restartButton.addEventListener("click", () => {
        socket.emit("restart_game"); // Send restart event
    });

    socket.on("restart", () => {
        // Reset the game
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
