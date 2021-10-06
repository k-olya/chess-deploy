import { nanoid } from 'nanoid'
import * as _ from 'lodash'
import Room from './Room'
import rooms from './rooms.js'
import { Chess } from "chess.js"

const MAX_PLAYERS = 2

const defaultState = {
    state: 'INITIAL',
    players: {white:"",black:""},
    fen: "",
    turn:""
}

const hitTestX = state => {
    const {x, y, vx, vy} = state.ball
    const p1 = state.player1
    const p2 = state.player2
    const x1 = x - 2.5, x2 = x + 2.5
    return (x1 <= 21 && p1.y - 12.5 <= y && p1.y + 12.5 >= y && vx < 0)
        || (x2 >= 235 && p2.y - 12.5 <= y && p2.y + 12.5 >= y && vx > 0)
}

const hitTestY = state => false

class GameRoom extends Room {
    constructor(io, id) {
        super(io, id)
        this.spectators = []
        this.state = _.cloneDeep(defaultState)
        this.chess = new Chess()
        this.state.fen = this.chess.fen()
        this.lastTick = new Date().getTime()
        this.state.lastGoal = this.lastTick
    }
    tick() {
      if (this.state.state === 'PLAYING') {
      }
      if (this.state.state === 'INITIAL') {
          if (this.players.length === 2) {
              this.state.state = 'PLAYING'
              this.io.emit('sp', {state: 'PLAYING'})
          }
      }

        super.tick()

        // collecting abandoned room
        if (this.lastTick - this.pinged > 60000) {
            Object.keys(this.io.connected).forEach(x => this.io.connected[x].leave(this.id))
            this.destructor()
        }
    }
    move(playerId, move) {
        if (!this.players.includes(playerId)) return this
        if (!move || !move.to || !move.from) return this
        let m
        try {
          m = this.chess.move(move)
        } catch (e) {
          console.log(e)
          m = null
        }
        if(!m) return this
        this.state.fen = this.chess.fen()
        this.state.turn = this.chess.turn()
        this.io.emit('sp', { fen: this.state.fen, turn: this.state.turn })
        this.io.emit('move', move)
    }
    join(socket) {
        socket.join(this.id)
        if (this.players.includes(socket.id) || this.spectators.includes(socket.id)) return this
        if (this.players.length >= MAX_PLAYERS) {
            this.spectators = this.spectators.concat([socket.id])
        } else {
            this.players = this.players.concat([socket.id])
        }
        if (this.state.players.white && !this.state.players.black) this.state.players.black = socket.id
        if (!this.state.players.white) this.state.players.white = socket.id
        this.sendState(socket)
        this.io.emit('sp', {players: this.state.players})
        this.io.to(socket.id).emit('message', `welcome ${socket.id} to GAME ROOM ${this.id}`)
        return this
    }
    leave(socket) {
      console.log(2)
        this.disconnect(socket.id)
        socket.leave(this.id)
    }
    disconnect(playerId) {
        if (this.state.players.white == playerId) this.state.players.white = ""
        if (this.state.players.black == playerId) this.state.players.black = ""
        this.io.emit('sp', {players: this.state.players})
        this.spectators = this.spectators.filter(p => p !== playerId)
        console.log(1)
        super.disconnect(playerId)
    }
}

export default GameRoom
