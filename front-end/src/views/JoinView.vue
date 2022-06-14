<template>
  <div class="center">
    <table>
      <tr>
        <td>Nickname:</td>
        <td>
          <input autocomplete='off' spellcheck='false' autocorrect='off' placeholder="enter a nickname" v-model="nickname" />
        </td>
      </tr>
      <tr>
        <td>Code:</td>
        <td><input autocomplete='off' spellcheck='false' autocorrect='off' placeholder="enter 4-letter code" v-model="code" /></td>
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
  async created() {
    try {
      let user = await this.$root.getUser();
      this.nickname = user?.nickname;
      this.code = user?.game?.code;
      if (this.$route.params.code) {
        this.code = this.$route.params.code;
      }
    } catch (error) {
      console.log(error);
    }
  },
  methods: {
    async join() {
      try {
        if (this.nickname === "" || this.code?.length !== 4) {
          alert("Please enter a nickname and a code.");
          return;
        }
        const response = await axios.post("/api/users", {
          nickname: this.nickname.toLowerCase(),
          code: this.code.toLowerCase(),
        });

        if (response.data.success) {
          this.$root.$data.user = response.data.user;
          this.$router.push("/" + this.user.game.type);
        } else {
          alert(response.data.message);
          this.user.game = null;
        }
      } catch (error) {
        console.log(error);
        this.user.game = null;
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