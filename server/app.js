/**
 * Main application file
 */
var express = require("express");
var mongoose = require("mongoose");
require("express-mongoose");
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

mongoose.connect('mongodb://localhost/wishList');

server.listen(3000);
app.use(express.static('../client'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('./routes')(app);

io.sockets.on('connection', function (socket) {
    //发送消息给客户端
    console.log('a user connected', socket.id);
    //连接成功则执行下面的监听
    socket.on('client.update', function (data) {
        socket.broadcast.emit('server.update', data);
    });
    socket.on('client.add', function (data) {
        socket.broadcast.emit('server.add', data);
    });
    socket.on('client.remove', function (data) {
        socket.broadcast.emit('server.remove', data);
    });
    //断开连接callback
    socket.on('disconnect', function() {
        console.log('Server has disconnected');
    });
});