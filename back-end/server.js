const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

mongoose.connect('mongodb://172.17.0.1:27017/games', {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: [
    'secretValue'
  ],
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

const games = require("./games.js");
app.use("/api/games", games.routes);

const users = require("./users.js");
app.use("/api/users", users.routes);

const names = require("./names.js");
app.use("/api/names", names.routes);

const story = require("./story.js");
app.use("/api/story", story.routes);

const path = '/etc/data/front-end/dist/';
app.use(express.static(path));
app.get('/', function (req,res) {
  res.sendFile(path + "index.html");
});

app.listen(3000, () => console.log('Server listening on port 3000!'));

