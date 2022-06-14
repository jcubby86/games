<template>
  <div class="center">
    <div class="container">
      <div
        class="button center"
        v-bind:class="{ selected: selectedType === 'story' }"
        @click="selectedType = 'story'"
      >
        He Said<br />She Said
      </div>
      <div
        class="button center"
        v-bind:class="{ selected: selectedType === 'names' }"
        @click="selectedType = 'names'"
      >
        Name Game
      </div>
    </div>
    <div class="desc" v-if="selectedType==='story'">Not working yet :&lpar;</div>
    <div class="desc" v-else-if="selectedType==='names'">
      Name Game description
      <div class="container sub">
        <div
          class="button center"
          v-bind:class="{ selected: selectedSubtype === 'mod' }"
          @click="selectedSubtype = 'mod'"
        >
          With<br />Moderator
        </div>
        <div
          class="button center"
          v-bind:class="{ selected: selectedSubtype === 'no mod' }"
          @click="selectedSubtype = 'no mod'"
        >
          No<br />Moderator
        </div>
      </div>
    </div>
    <table v-if="selectedType==='names'">
      <tr>
        <td>Nickname:</td>
        <td>
          <input autocomplete='off' spellcheck='false' autocorrect='off' placeholder="enter a nickname" v-model="nickname" />
        </td>
      </tr>
    </table>
    <br />
    <div v-if="selectedType==='names'" class="button center" @click="create">Create Game</div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "CreateGame",
  data() {
    return {
      selectedType: "",
      selectedSubtype: "no mod",
      nickname: "",
    };
  },
  async created() {
    let user = await this.$root.getUser();
    this.nickname = user?.nickname;
  },
  methods: {
    async create() {
      if (
        this.nickname === "" ||
        (this.selectedType !== "story" && this.selectedType !== "names")
      ) {
        alert("Please enter a nickname and select a game type.");
        return;
      }
      try {
        const response1 = await axios.post("/api/games/" + this.selectedType, {
          creator: this.nickname,
          subtype: this.selectedSubtype,
        });
        const response2 = await axios.post("/api/users", {
          nickname: this.nickname.toLowerCase(),
          code: response1.data.game.code,
        });
        if (response2.data.success) {
          this.$root.$data.user = response2.data.user;
          this.$router.push("/" + this.user.game.type);
        } else {
          alert(response2.data.message);
        }
      } catch (error) {
        console.log(error);
      }
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
.container div {
  user-select: none;
  aspect-ratio: 3/2;
  background-color: var(--primary);
  border: 2px var(--darkest) solid;
  padding: 5px;
  color: white;
  font-size: 1.4rem;
}

.container div:hover,
.container div.selected {
  transform: scale(1.1);
  background-color: var(--darker);
}

.button {
  aspect-ratio: 3/1;
}

.sub .button {
  font-size: 1rem;
}

.desc {
  margin-bottom: 20px;
}
</style>