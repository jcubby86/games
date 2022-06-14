const express = require("express");
const mongoose = require('mongoose');

const router = express.Router();

const users = require("./users.js");
const validUser = users.validUser;


router.get('/', validUser, async (req, res) => {
  try {
    let user = req.user;
    let game = user.game;

    if (!game) {
      return res.send({ message: "not logged in", success: false });
    }

    if (game.state === 'join') {
      for (const element of game.names) {
        if (element.owner === user.nickname) {
          return res.send({ message: "wait", success: true });
        }
      }
      return res.send({ message: "enter", success: true });
    } else if (game.state === 'ready') {
      return res.send({ message: "ready", success: true, game: game });
    } else {
      return res.send({ message: "play", success: true, game: game });
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.post('/', validUser, async (req, res) => {
  try {
    let user = req.user;
    let game = user.game;

    if (!game) {
      return res.sendStatus(403);
    }

    if (game.state === 'join') {
      for (const element of game.names) {
        if (element.owner === user.nickname) {
          return res.send({ message: "You already submitted a name.", success: false });
        } else if (element.name === req.body.name) {
          return res.send({ message: "That name is already in use.", success: false });
        }
      }

      game.names.push({ owner: user.nickname, name: req.body.name });
      await game.save();

      return res.status(201).send({ success: true });
    }


  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.put("/:state", validUser, async (req, res) => {
  try {
    let game = req.user.game;

    if (game.state === 'join' && game.subtype === 'mod') {
      game.state = 'play';
    } else {
      game.state = req.params.state;
    }

    await game.save();
    return res.status(201).send({ game: game, success: true });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

module.exports = {
  routes: router
};