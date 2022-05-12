const express = require("express");
const mongoose = require('mongoose');

const router = express.Router();

const gameSchema = new mongoose.Schema({
  type: String,
  code: String,
  state: String,
  timestamp: Date
});


const Game = mongoose.model('Game', gameSchema);

const getCode = async () => {
  while (true) {
    let c = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 4);
    let search = await Game.findOne({code: c});
    if (!search) {
      return c;
    }
  }
};

router.post("/:type", async (req, res) => {
  if (req.params.type !== "story" && req.params.type !== "names") {
    return res.status(400).send({
      message: "Invalid game type"
    });
  }

  const code = await getCode();
  const game = new Game({
    type: req.params.type,
    code: code,
    state: "join",
    timestamp: new Date()
  });

  try {
    await game.save();
    return res.send(game);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

module.exports = {
  routes: router,
  model: Game
};