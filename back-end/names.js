const express = require("express");
const mongoose = require('mongoose');

const router = express.Router();

const users = require("./users.js");
const validUser = users.validUser;

function shuffleArray(array) {
  let curId = array.length;
  // There remain elements to shuffle
  while (0 !== curId) {
    // Pick a remaining element
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    // Swap it with the current element.
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}

router.get('/', validUser, async (req, res) => {
  try {
    let user = req.user;
    let game = user.game;

    if (!game) {
      return res.send({ message: "not logged in", success: false });
    }

    if (game.state === 'join') {
      return res.send({ message: "join", success: true, numplayers: game.names.length });
    } else if (game.state === 'enter') {
      if (game.subtype === 'mod' && game.creator === user.nickname) {
        return res.send({ message: "wait", success: true });
      }
      for (const element of game.names) {
        if (element.owner === user.nickname && element.name !== '') {
          return res.send({ message: "wait", success: true });
        }
      }
      return res.send({ message: "enter", success: true });
    } else if (game.state === 'ready') {
      return res.send({ message: "ready", success: true, game: game });
    } else if (game.subtype === 'mod' && game.creator === user.nickname) {
      return res.send({ message: "mod", success: true, game: game });
    } else {
      return res.send({ message: "play", success: true });
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

    if (game.state === 'enter') {
      let obj;
      let empty = 0;
      for (const element of game.names) {
        if (element.owner === user.nickname) {
          obj = element;
        } else if (element.name.toLowerCase() === req.body.name.toLowerCase()) {
          return res.send({ message: "That name is already in use.", success: false });
        } else if (element.name === '') {
          empty++;
        }
      }

      if (empty === 0){
        game.state = (game.subtype === 'mod') ? 'play' : 'ready';
        game.names = shuffleArray(game.names);
      }

      obj.name = req.body.name;
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
    game.state = req.params.state;

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