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
  async created() {
    let user = await this.$root.getUser()
    this.nickname = user?.nickname;
  },
  methods: {
    async create() {
      if (this.nickname === '' || (this.selected!=='story' && this.selected!=='names')){
        alert('Please enter a nickname and select a game type.');
        return;
      }
      try {
        const response1 = await axios.post("/api/games/" + this.selected);
        const response2 = await axios.post("/api/users", {
          nickname: this.nickname,
          code: response1.data.code,
        });
        this.$root.$data.user = response2.data;
        if (response2.data.game){
          this.$router.push('/' + response2.data.game.type);
        } else {
          alert(response2.data.message);
        }
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