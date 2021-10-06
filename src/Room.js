import { nanoid } from 'nanoid'
import rooms from './rooms.js'

const freq = 30

class Room {
    constructor(io, id, f = freq) {
        this.players = []
        this.id = id || nanoid()
        this.lastTick = new Date().getTime()
        this.pinged = this.lastTick
        this.io = io.to(this.id)
        this.interval = setInterval(() => this.tick(), 1000.0 / f)
        rooms.set(this.id, this)
    }
    tick() {
        this.lastTick = new Date().getTime()
    }
    ping(socket) {
        this.pinged = new Date().getTime()
        socket.emit('pong')
    }
    join(socket) {
        socket.join(this.id)
        if (this.players.includes(socket.id)) return this
        this.players.push(socket.id)
        this.sendState(socket)
        this.io.to(socket.id).emit('message', `welcome ${socket.id} to ${this.id}`)
        return this
    }
    sendState(socket) {
        this.state && socket.emit('state', this.state) && console.log('state sent')
    }
    broadcastState() {
        this.io.emit('state', this.state)
    }
    move(playerId, move) {
    }
    disconnect(playerId) {
        this.players = this.players.filter(p => p !== playerId)
    }
    leave(socket) {
        this.disconnect(socket.id)
        socket.leave(this.id)
    }
    destructor() {
        console.log(`collecting abandoned room ${this.id}`)
        clearInterval(this.interval)
        rooms.delete(this.id)
    }
}

export default Room
