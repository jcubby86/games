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
    } else if (game.state === 'join') {
      return res.send({ message: "join", success: true, phase: -1 });
    } else if (game.state === 'play') {
      let userPhase = 0;
      let minPhase = 10;
      for (const element of game.stories) {
        if (element.owner === user.nickname) {
          userPhase = element.parts.length;
        }
        if (element.parts.length < minPhase) minPhase = element.parts.length;
      }

      if (userPhase === minPhase) {
        return res.send({ message: "play", success: true, phase: userPhase });
      } else {
        return res.send({ message: "wait", success: true, phase: userPhase });
      }
    } else {
      return res.send({ message: 'read', success: true, game: game });
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
    } else if (game.state === 'play') {
      let minPhase = 10;
      for (const element of game.stories) {
        if (element.owner === user.nickname) {
          element.parts.push(req.body.part);
        }
        if (element.parts.length < minPhase) minPhase = element.parts.length;
      }

      if (minPhase === 6) {
        let stories = [];
        for (let i = 0; i < game.stories.length; i++) {
          let s = [];
          for (let j = 0; j < 6; j++) {
            s.push(game.stories[(i + j) % game.stories.length].parts[j]);
          }
          stories.push({ owner: game.stories[i].owner, parts: s });
        }
        game.stories = stories;
        game.state = 'read';
      }

      await game.save();

      return res.status(201).send({ success: true });
    } else {
      res.sendStatus(400);
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