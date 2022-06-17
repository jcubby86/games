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
  if (game.state === 'end' || new Date() - game.timestamp > 1000 * 60 * 60 * 2) {
    game.state = 'end';
    await game.save();
    return false;
  }
  return true;
};

const validUser = async (req, res, next) => {
  if (!req.session.userID) return res.send({ success: false });

  try {
    const user = await User.findOne({
      _id: req.session.userID
    }).populate('game');

    if (!user) return res.send({ success: false });

    let gameExists = await checkGameExists(user.game);
    if (!gameExists) {
      user.game = null;
      await user.save();
    }

    req.user = user;
  } catch (error) {
    return res.sendStatus(500);
  }

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
    let game = await Game.findOne({ code: req.body.code, state: 'join' });

    const gameExists = await checkGameExists(game);

    let user;
    if (req.session.userID) {
      user = await User.findOne({
        _id: req.session.userID
      }).populate('game');
    }

    if (user) {
      if (!gameExists) {
        const currGameExists = await checkGameExists(user.game);
        if (currGameExists && req.body.code === user.game.code) return res.send({ user: user, success: true });
        else return res.send({ success: false, message: 'Game does not exist or can no longer be joined.' });
      }
      user.game = game;
      user.nickname = req.body.nickname;
    } else {
      if (!gameExists) return res.send({ success: false, message: 'Game does not exist or can no longer be joined.' });
      user = new User({
        game: game,
        nickname: req.body.nickname
      });
    }
    if (game.type === 'story') {
      game.stories.push({ owner: req.body.nickname, parts: [] });
      await game.save();
    }

    const unique = await uniqueUsername(req.body.nickname, game, user._id);
    if (!unique) return res.send({ success: false, message: 'Username is already taken.' });

    req.session.userID = user._id;

    await user.save();
    res.status(201).send({ user: user, success: true });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.get('/', validUser, async (req, res) => {
  try {
    if (req.user.game) {
      req.user.game.names = null;
    }
    res.send({ user: req.user, success: true });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

module.exports = {
  routes: router,
  model: User,
  validUser: validUser
};