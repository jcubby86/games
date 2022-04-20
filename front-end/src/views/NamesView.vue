<template>
  <div class="center">Name Game</div>
</template>

<script>
import axios from "axios";
export default {
  name: "NamesView",
  data() {
    return {
      nickname: "",
      code: "",
    };
  },
  computed: {
    user() {
      return this.$root.$data.user;
    }
  },
  async created() {
    await this.getUser();
    if (!this.user || this.user.game.type !== 'names') this.$router.push('/');
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