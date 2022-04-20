<template>
  <div class="center">
    <table>
      <tr>
        <td>Nickname:</td>
        <td>
          <input placeholder="enter a nickname" v-model="nickname" />
        </td>
      </tr>
      <tr>
        <td>Code:</td>
        <td><input placeholder="enter 4-letter code" v-model="code" /></td>
      </tr>
    </table>
    <div class="button center" @click="join">Join Game</div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "JoinView",
  data() {
    return {
      nickname: "",
      code: "",
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
      this.code = this.user.game.code;
      this.nickname = this.user.nickname;
    }
    if (this.$route.params.code) {
      this.code = this.$route.params.code;
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
    async join() {
      if (this.nickname === '' || this.code.length !== 4){
        alert('Please enter a nickname and a code.');
        return;
      }
      try {
        const response = await axios.post("/api/users", {
          nickname: this.nickname,
          game: this.code,
        });
        this.$root.$data.user = response.data;
        this.$router.push('/' + this.user.game.type);
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style scoped>
td {
  padding-right: 5px;
  text-align: right;
}
table {
  margin-bottom: 10px;
}

.button {
  aspect-ratio: 3/1;
}
</style>