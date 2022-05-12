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

const checkGameExists = async (game) => {
  if (!game) {
    return false;
  }
  if (game.state === 'end' || new Date() - game.timestamp > 1000 * 60 * 60 * 2){
    game.state = 'end';
    await game.save();
    return false;
  }
  return true;
};

const validUser = async (req, res, next) => {
  if (!req.session.userID)
    return res.status(403).send({
      message: "not logged in"
    });
  try {
    const user = await User.findOne({
      _id: req.session.userID
    }).populate('game');

    if (!user) {
      return res.status(403).send({
        message: "not logged in"
      });
    }

    let gameExists = await checkGameExists(user.game);
    if (!gameExists){
      user.game = null;
      await user.save();
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

const uniqueUsername = async (name, game, id) => {
  let user = await User.findOne({
    _id: id,
    nickname: name,
    game: game
  });
  if (user) return true;
  user = await User.findOne({
    nickname: name,
    game: game
  });
  return !user;
};

router.post('/', async (req, res) => {
  try {
    let game = await Game.findOne({code: req.body.code, state: 'join'});

    const gameExists = await checkGameExists(game);
    if (!gameExists){
      return res.status(400).send({
        message: "game doesn't exist"
      });
    }

    let user;
    if (req.session.userID) {
      user = await User.findOne({
        _id: req.session.userID
      });
    }

    if (user){
      user.game = game;
      user.nickname = req.body.nickname;
    } else {
      user = new User({
        game: game,
        nickname: req.body.nickname
      });
    }

    const unique = await uniqueUsername(req.body.nickname, game, user._id);
      if (!unique) {
        return res.status(400).send({
          message: "username already taken"
        });
      }

    req.session.userID = user._id;

    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.get('/', validUser, async (req, res) => {
  try {
    res.send({
      user: req.user
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

// router.delete("/", validUser, async (req, res) => {
//   try {
//     req.session = null;
//     res.sendStatus(200);
//   } catch (error) {
//     console.log(error);
//     return res.sendStatus(500);
//   }
// });

module.exports = {
  routes: router,
  model: User
};