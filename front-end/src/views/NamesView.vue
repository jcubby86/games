<template>
  <div class="center">Name Game</div>
</template>

<script>
export default {
  name: "NamesView",
  data() {
    return {
      nickname: "",
      code: "",
    };
  },
  async created() {
    let user = await this.$root.getUser();
    if (!user || !user.game || user.game.type !== 'names') this.$router.push('/');
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