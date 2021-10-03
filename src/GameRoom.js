import { nanoid } from 'nanoid'
import * as _ from 'lodash'
import Room from './Room'
import rooms from './rooms.js'

const MAX_PLAYERS = 2

const defaultState = {
    player1: {
        up: false,
        down: false,
        y: 64
    },
    player2: {
        up: false,
        down: false,
        y: 64
    },
    ball: {
        x: 128,
        y: 64,
        vx: 2,
        vy: 2
    },
    lastGoal: 0,
    state: 'INITIAL'
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
        this.lastTick = new Date().getTime()
        this.state.lastGoal = this.lastTick
    }
    tick() {
      if (this.state.state === 'PLAYING') {
        this.state.ball.x+=this.state.ball.vx
        this.state.ball.y+=this.state.ball.vy
        if (this.state.ball.x >= 256 || this.state.ball.x <= 0) {
            this.state.ball.vx*=-1
            this.state.lastGoal = new Date().getTime()
            this.io.binary(true).to(this.id).emit('sp', {lastGoal: this.state.lastGoal})
        } else if (hitTestX(this.state)) this.state.ball.vx*=-1
        if (this.state.ball.y >= 128 || this.state.ball.y <= 0 || hitTestY(this.state)) this.state.ball.vy*=-1
        this.io.binary(true).to(this.id).emit('sp', {ball:{x:this.state.ball.x, y:this.state.ball.y}})

        if (this.state.player1.up && this.state.player1.y > 12.5) this.state.player1.y -= 2
        if (this.state.player1.down && this.state.player1.y < 115.5) this.state.player1.y += 2
        if (this.state.player2.up && this.state.player2.y > 12.5) this.state.player2.y -= 2
        if (this.state.player2.down && this.state.player2.y < 115.5) this.state.player2.y += 2
        this.io.binary(true).to(this.id).emit('sp', {player1: this.state.player1, player2: this.state.player2})
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
    keyDown(playerId, key) {
        if (!this.players.includes(playerId)) return this
        this.state[`player${this.players[0] === playerId ? 1 : 2}`][key === 'up' ? 'up' : 'down'] = true
    }
    keyUp(playerId, key) {
        if (!this.players.includes(playerId)) return this
        this.state[`player${this.players[0] === playerId ? 1 : 2}`][key === 'up' ? 'up' : 'down'] = false
    }
    join(socket) {
        socket.join(this.id)
        if (this.players.includes(socket.id) || this.spectators.includes(socket.id)) return this
        if (this.players.length >= MAX_PLAYERS) {
            this.spectators = this.spectators.concat([socket.id])
        } else {
            this.players = this.players.concat([socket.id])
        }
        this.sendState(socket)
        this.io.to(socket.id).emit('message', `welcome ${socket.id} to GAME ROOM ${this.id}`)
        return this
    }
    disconnect(playerId) {
        super.disconnect(playerId)
        this.spectators = this.spectators.filter(p => p !== playerId)
    }
}

export default GameRoom
