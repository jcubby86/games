<template>
  <div class="center">
    <h1>He Said She Said</h1>
    <div class="center" v-if="display === 'play'">
      <div>
        <p>{{ helper }} {{ prefix }}</p>
        <textarea :placeholder="prompt" @keydown.enter="enter" v-model="input" />
        <p style="margin-top: 0;">{{ suffix }}</p>
      </div>
      <div class="container">
        <div class="button center" @click="enter">Send</div>
      </div>
    </div>
    <div class="center" v-else-if="display === 'read'">
      <h2>Story:</h2>
      <span v-for="part in story" v-bind:key="part">{{ part }}</span>
    </div>
    <div class="center" v-else>
      <h2>Please wait...</h2>
      <p v-if="isGameCreator">Players: {{numplayers}} </p>
      <p v-if="isGameCreator && display === 'join'">Once everyone is ready, click below!</p>
    </div>
    <div v-if="isGameCreator" class="container">
      <div v-if="display === 'join'" class="button center" @click="play">
        Ready!
      </div>
      <div v-if="display === 'read'" class="button center" @click="end">
        End Game
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "StoryView",
  data() {
    return {
      display: "join",
      prompt: "",
      helper: "",
      prefix: "",
      suffix: "",
      isGameCreator: false,
      input: "",
      prompts: [
        "Man's name",
        "Woman's name",
        "Activity",
        "",
        "",
        "Activity",
      ],
      helpers: ["", "(Man) ", "(Man) and (Woman) ", "", "", ""],
      prefixes: ["", "and ", "were ", 'He said, "', 'She said, "', "So they "],
      suffixes: ["", "", ". ", '." ', '." ', "."],
      story: null,
      numplayers: 0,
    };
  },
  async created() {
    try {
      let user = await this.$root.getUser();
      if (!user || !user.game || user.game.type !== "story") {
        this.$router.push("/");
        return;
      }

      this.isGameCreator = user.game.creator === user.nickname;

      let result = await axios.get("/api/story");
      let display = result.data.message;
      this.display = display;

      if (display === "join") {
        this.numplayers = result.data.numplayers;
        this.wait();
      } else if (display === "wait") {
        this.wait();
      } else if (display === "play") {
        this.setStuff(result.data.phase);
      } else if (display === "read") {
        this.setStory(result.data.game);
      }
    } catch (error) {
      console.log(error);
      this.$root.$data.user.game = null;
      this.$router.push("/");
    }
  },
  methods: {
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async wait() {
      try {
        while (true) {
          let result = await axios.get("/api/story");
          let display = result.data.message;
          this.display = display;

          if (display === "join") {
            this.numplayers = result.data.numplayers;
          } else if (result.data.message === "play") {
            this.setStuff(result.data.phase);
            return;
          } else if (result.data.message === "read") {
            this.setStory(result.data.game);
            return;
          }
          await this.sleep(3000);
        }
      } catch (error) {
        console.log(error);
        this.user.game = null;
        this.$router.push("/");
      }
    },
    async enter() {
      try {
        if (!this.input || this.input === "") {
          alert("Please enter a response to the prompt");
          return;
        }
        let result = await axios.post("/api/story", { part: this.input });
        if (!result.data.success) {
          alert(result.data.message);
          return;
        }
        this.display = "wait";
        this.input = "";
        this.wait();
      } catch (error) {
        console.log(error);
        this.user.game = null;
        this.$router.push("/");
      }
    },
    async play() {
      await axios.put("/api/story/play");
    },
    async end() {
      await axios.put("/api/story/end");
      this.user.game = null;
      this.$router.push("/");
    },
    setStory(game) {
      let story;
      for (const element of game.stories) {
        if (element.owner === this.user.nickname) {
          story = element.parts;
        }
      }
      for (let i = 0; i < story.length; i++) {
        story[i] = this.prefixes[i] + story[i] + this.suffixes[i];
      }
      this.story = story;
    },
    setStuff(number) {
      this.prompt = this.prompts[number];
      this.helper = this.helpers[number];
      this.prefix = this.prefixes[number];
      this.suffix = this.suffixes[number];
    },
  },
  computed: {
    user() {
      return this.$root.$data.user;
    },
  },
};
</script>

<style scoped>
.button {
  margin-top: 20px;
  aspect-ratio: 2/1;
  width: min(40%, 70px);
  padding: 10px;
}

h1 {
  text-decoration: underline;
  margin-bottom: 20;
}

h2 {
  margin-bottom: 0;
}

p {
  margin-bottom: 0;
}

span {
  margin: 5px;
  display: inline-block;
}

input {
  display: inline-block;
}

textarea {
  width: 90%;
  height: 50px;
}

.container {
  justify-content: center;
}

.container .button {
  flex: 0;
}
</style>