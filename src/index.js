import Koa from 'koa'
import httpModule from 'http'
import SocketIO from 'socket.io'
import { port } from './config.json'
import Events from './events.js'
import Lobby from './Lobby'
import rooms from './rooms.js'

const app = new Koa()
const http = httpModule.createServer(app.callback())
const io = SocketIO(http)

app.use(async ctx => {
  ctx.body = '<h1>Hello world</h1>';
})

const lobby = new Lobby(io)

io.on('connection', socket => {
  console.log('a user connected')
  socket.emit('message', `hello, user #${socket.id}`)
  const events = Events(socket, io)

  Object.keys(events).forEach(name => socket.on(name, events[name]))

  socket.on('disconnect', () => {
    console.log(`user #${socket.id} disconnected`);
    console.log(rooms.keys());
    rooms.forEach((v,id) => v.leave(socket))
  })
})

http.listen(port, x => { console.log('http server started on port ' + port) })
