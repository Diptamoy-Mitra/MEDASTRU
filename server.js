require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 5000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
// const MongoDbStore = require('connect-mongo')(session)
const passport = require('passport')
const Emitter = require('events')


const MongoDbStore = require('connect-mongodb-session')(session);

//data base connection
const url = 'mongodb+srv://mondalpramit76:sh2sZJvbuDqUVHME@cluster0.fblw1sf.mongodb.net/Curological';
// const url="mongodb://localhost/Curological"
mongoose.connect('mongodb+srv://mondalpramit76:sh2sZJvbuDqUVHME@cluster0.fblw1sf.mongodb.net/Curological');
const connection = mongoose.connection;
// mongoose.connect(url, (err) => {
//   if (err) throw err;
//   console.log("Connected to database")
// })
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function callback () {
  console.log("h");
});




// session store
let mongoStore=new MongoDbStore({
  mongooseConnection:connection,
  collection: 'sessions'
})

// session config
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  //
  // store:  new MongoDbStore({ mongooseConnection: connection,collection: 'sessions'}),
  store:mongoStore,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }  //24 hours
  // cookie: { maxAge: 1000 * 15 },
}))





// Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())




// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)
app.use(flash())
// Assets
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})
// set Template engine
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

require('./routes/web')(app)
app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(PORT , () => {
            console.log(`Listening on port ${PORT}`)
        })

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})

