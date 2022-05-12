<template>
  <div class="center">He Said She Said</div>
</template>

<script>
export default {
  name: "StoryView",
  data() {
    return {
      nickname: "",
      code: "",
    };
  },
  async created() {
    let user = await this.$root.getUser();
    if (!user || !user.game || user.game.type !== 'story') this.$router.push('/');
  }
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