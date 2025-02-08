from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

players = {}  # Dictionary to store player roles (X or O)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    """ Assign X to the first player, O to the second. Reject the third player. """
    if len(players) < 2:
        player_symbol = "X" if "X" not in players.values() else "O"
        players[request.sid] = player_symbol
        emit('assign_player', player_symbol)
    else:
        emit('game_full')

@socketio.on('disconnect')
def handle_disconnect():
    """ Remove the player from the game when they leave. """
    if request.sid in players:
        del players[request.sid]

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
