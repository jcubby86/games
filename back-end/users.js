const express = require("express");
const mongoose = require('mongoose');

const router = express.Router();

const games = require("./games.js");
const Game = games.model;

const userSchema = new mongoose.Schema({
  nickname: String,
  game: {
    type: mongoose.Schema.ObjectId,
    ref: 'Game'
  },
});

const User = mongoose.model('User', userSchema);

const validUser = async (req, res, next) => {
  if (!req.session.userID)
    return res.status(403).send({
      message: "not logged in"
    });
  try {
    const user = await User.findOne({
      _id: req.session.userID
    });
    if (!user) {
      return res.status(403).send({
        message: "not logged in"
      });
    }
    // set the user field in the request
    req.user = user;
  } catch (error) {
    // Return an error if user does not exist.
    return res.status(403).send({
      message: "not logged in"
    });
  }

  // if everything succeeds, move to the next middleware
  next();
};

router.post('/', async (req, res) => {
  const game = await Game.findOne({code: req.body.game});
  if (!game || game.state !== "join") {
    return res.status(400).send({
      message: "Invalid game id"
    });
  }
  const search = await User.findOne({nickname: req.body.nickname});
  if (search) {
    return res.status(400).send({
      message: "Name already taken"
    });
  }

  const user = new User({
    game: game,
    nickname: req.body.nickname
  });
  
  req.session.userID = user._id;

  try {
    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.delete("/", validUser, async (req, res) => {
  try {
    req.session = null;
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

module.exports = {
  routes: router,
  model: User
};