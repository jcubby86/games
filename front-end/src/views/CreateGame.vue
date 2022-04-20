<template>
  <div class="center">
    <div class="container">
      <div class="button center" v-bind:class="{selected: selected==='story'}" @click="selected='story'">He Said<br/>She Said</div>
      <div class="button center" v-bind:class="{selected: selected==='names'}" @click="selected='names'">Name Game</div>
    </div>
    <div v-if="selected==='story'">
      He Said She Said description
    </div>
    <div v-else-if="selected==='names'">
      Name Game description
    </div>
     <table>
      <tr>
        <td>Nickname:</td>
        <td>
          <input placeholder="enter a nickname" v-model="nickname" />
        </td>
      </tr>
    </table>
    <br/>
    <div class="button center" @click="create">Create Game</div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "CreateGame",
  data() {
    return {
      selected: "",
      nickname: "",
    };
  },
  computed: {
    user() {
      return this.$root.$data.user;
    },
  },
  async created() {
    await this.getUser();
    if (this.user){
      this.nickname = this.user.nickname;
    }
  },
  methods: {
    async getUser() {
      if (this.user) return;
      try {
        let response = await axios.get("/api/users");
        this.$root.$data.user = response.data.user;
      } catch (error) {
        this.$root.$data.user = null;
      }
    },
    async create() {
      if (this.nickname === '' || (this.selected!=='story' && this.selected!=='names')){
        alert('Please enter a nickname and select a game type.');
        return;
      }
      try {
        const response1 = await axios.post("/api/games/" + this.selected);
        const response2 = await axios.post("/api/users", {
          nickname: this.nickname,
          game: response1.data.code,
        });
        this.$root.$data.user = response2.data;
        this.$router.push('/' + this.user.game.type);
      } catch (error) {
        console.log(error);
      }

    },
  },
};
</script>

<style scoped>
.container div {
  user-select: none;
  aspect-ratio: 3/2;
  background-color: var(--primary);
  border: 2px var(--darkest) solid;
  padding: 5px;
  color: white;
  font-size: 1.4rem;
}

.container div:hover, .container div.selected {
  transform: scale(1.1);
  background-color: var(--darker);
}

.button {
  aspect-ratio: 3/1;
}
</style>