import rooms from './rooms.js'
import GameRoom from './GameRoom'

const events = (socket, io) => ({
    join: roomId => rooms.has(roomId) ? rooms.get(roomId).join(socket) : socket.emit('message', 'no such room'),
    leave: roomId => rooms.has(roomId) ? rooms.get(roomId).leave(socket) : socket.emit('message', 'no such room'),
    getState: () => Object.keys(socket.rooms).map(id => rooms.has(id) && rooms.get(id).sendState(socket)),
    move: move => Object.keys(socket.rooms).map(id => rooms.has(id) && rooms.get(id).move(socket.id, move)),
    _ping: roomId => Object.keys(socket.rooms).map(id => rooms.has(id) && roomId === id && rooms.get(id).ping(socket)),
    create: () => socket.emit('newRoom', new GameRoom(io).id)
})

export default events
