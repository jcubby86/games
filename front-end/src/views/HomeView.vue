<template>
  <div class="center">
    <div class="container">
      <div class="button center" @click="join">Join a Game</div>
      <div class="button center" @click="create">Create a Game</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HomeView",
  methods: {
    join() {
      this.$router.push('/join');
    },
    create() {
      this.$router.push('/create');
    }
  },
};
</script>

<style scoped>
.button {
  aspect-ratio: 3/2;
  font-size: 1.4rem;
}
</style>