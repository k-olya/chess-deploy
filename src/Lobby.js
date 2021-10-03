import { nanoid } from 'nanoid'
import Room from './Room'
import GameRoom from './GameRoom'
import rooms from './rooms.js'

class Lobby extends Room {
    constructor(io, id = 'lobby', f) {
        super(io, id, f)
        this.masterIo = io
    }
    tick() {
        this.io.to(this.id).emit('queueLength', this.players.length)
        if (this.players.length > 1) {
            let room = new GameRoom(this.masterIo)
            this.io.to(this.players[0]).to(this.players[1]).emit('newRoom', room.id)
            this.io.connected[this.players[0]]?.leave(this.id)
            this.io.connected[this.players[1]]?.leave(this.id)
            console.log(`sent ${this.players[0]} and ${this.players[1]} to ${room.id}`)
            this.players = this.players.slice(2)
        }
        super.tick()
    }
}

export default Lobby
