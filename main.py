from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

players = {}  # Dictionary to store player roles (X or O)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join_game')
def handle_join_game(username):
    """ Assign X to first player, O to second, prevent third. """
    if len(players) < 2:
        symbol = "X" if "X" not in players else "O"
        players[symbol] = {"username": username, "sid": request.sid}
        emit('assign_player', {"symbol": symbol, "username": username})
        emit('update_players', players, broadcast=True)
    else:
        emit('game_full')

@socketio.on('disconnect')
def handle_disconnect():
    """ Remove the player from the game when they leave. """
    for symbol, data in list(players.items()):
        if data["sid"] == request.sid:
            del players[symbol]
            emit('update_players', players, broadcast=True)
            break

@socketio.on('move')
def handle_move(data):
    """ Broadcast moves to all connected clients. """
    emit('update_board', data, broadcast=True)

@socketio.on('restart_game')
def handle_restart():
    """ Reset the board for all players. """
    emit('restart', broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True)
