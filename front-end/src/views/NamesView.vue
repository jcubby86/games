<template>
  <div class="center">
    <h1>Name Game</h1>
    <div class="center" v-if="display === 'join'">
      <h2>Please wait...</h2>
      <p v-if="isGameCreator">Once everyone is ready, click below!</p>
      <p v-if="isGameCreator">Players: {{numplayers}} </p>
      <div v-if="isGameCreator" class="button center" @click="ready">
        Ready!
      </div>
    </div>
    <div class="center" v-else-if="display === 'enter'">
      <h2>Enter a name</h2>
      <p>
        It should be a name that others would know, but don't make it too
        obvious!
      </p>
      <input placeholder="enter a name" @keydown.enter="enter" v-model="name" />
      <div class="container">
        <div class="button center" @click="enter">Send</div>
      </div>
    </div>
    <div class="center" v-else-if="display === 'ready' || display === 'mod'">
      <h2>Names:</h2>
      <span v-for="name in names" v-bind:key="name._id">{{ name.name }}</span>
    </div>
    <div class="center" v-else-if="display === 'play'">
      <h2>Play!</h2>
      <p>Put your phone away and guess some names!</p>
    </div>
    <div class="center" v-else>
      <h2>Please wait...</h2>
    </div>
    <div v-if="isGameCreator" class="container">
      <div v-if="display === 'ready' || display === 'mod'" class="button center" @click="hide">
        Hide Names
      </div>
      <div v-if="display === 'play'" class="button center" @click="show">
        Show Names
      </div>
      <div v-if="showEnd" class="button center" @click="end">End Game</div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "NamesView",
  data() {
    return {
      display: "wait",
      name: "",
      isGameCreator: false,
      showEnd: false,
      names: null,
      numplayers: 0,
    };
  },
  async created() {
    try {
      let user = await this.$root.getUser();
      if (!user || !user?.game || user?.game?.type !== "names") {
        this.$router.push("/");
        return;
      }

      this.isGameCreator = user.game.creator === user.nickname;

      let result = await axios.get("/api/names");
      let display = result.data.message;
      this.display = display;

      if (display === 'join') {
        this.numplayers = result.data.numplayers;
      }

      if (display === "ready" || display === "mod") {
        this.names = result.data.game.names;
        this.showEnd = true;
      }
      
      if (display === 'wait' || display === 'join' || display === 'ready') {
        this.wait();
      }
    } catch (error) {
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
          let result = await axios.get("/api/names");
          let display = result.data.message;
          this.display = display;

          if (display === 'join') {
            this.numplayers = result.data.numplayers;
          }

          if (display === "ready" || display === "mod") {
            if (!this.names) {
              this.names = result.data.game.names;
            }
            this.showEnd = true;
          }
          if (display === "mod" || "display" === "play" || display === "enter") {
            return;
          }

          await this.sleep(3000);
        }
      } catch (error) {
        this.user.game = null;
        this.$router.push("/");
      }
    },
    async enter() {
      try {
        if (!this.name || this.name === "") {
          alert("Please enter a name.");
          return;
        }
        let result = await axios.post("/api/names", { name: this.name });
        if (!result.data.success) {
          alert(result.data.message);
          return;
        }
        this.display = "wait";
        this.wait();
      } catch (error) {
        this.user.game = null;
        this.$router.push("/");
      }
    },
    async ready() {
      await axios.put("/api/names/enter");
      this.display = "wait";
      this.wait();
    },
    async hide() {
      await axios.put("/api/names/play");
      this.display = "play";
      this.showEnd = true;
    },
    async show() {
      this.display = "ready";
    },
    async end() {
      await axios.put("/api/names/end");
      this.user.game = null;
      this.$router.push("/");
    }
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
  margin-bottom: 0;
}

h2 {
  margin-bottom: 0;
}

p {
  margin-bottom: 0;
}

span {
  margin: 5px;
}

input {
  margin-top: 20px;
}

.container {
  justify-content: center;
}

.container .button {
  flex: 0;
}
</style>