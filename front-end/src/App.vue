<template>
  <div id="app">
    <div class="header">
      <router-link class="simple" to="/"> Games </router-link>
    </div>
    <div class="main">
      <router-view />
    </div>
    <div class="footer" v-if="user && user.game" @click="rejoin">
      <div style="left: 0">{{ user.nickname }}</div>
      <div style="right: 0">code: {{ user.game.code }}</div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    user() {
      return this.$root.$data.user;
    },
  },
  async created() {
    try {
      await this.$root.getUser();
    } catch (error) {
      console.log(error);
    }
  },
  methods: {
    async rejoin() {
      this.$router.push("/" + this.user.game.type);
    },
  },
};
</script>

<style>
:root {
  --lightest: #add7f6;
  --lighter: #87bfff;
  --primary: #3f8efc;
  --darker: #2667ff;
  --darkest: #3b28cc;
}

#app {
  font-family: "Arial Black", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

* {
  font-family: "Arial Black", sans-serif;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  height: 30px;
  width: 100%;
  background-color: var(--darkest);
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 30px;
  width: 100%;
  background-color: var(--darkest);
  height: 30px;
  cursor: pointer;
}

.footer > div {
  margin: 5px;
  position: fixed;
  color: white;
}

.main {
  margin: 60px 0;
}

.center {
  display: grid;
  place-items: center;
}

.button {
  user-select: none;
  width: min(80%, 150px);
  background-color: var(--lightest);
  border: 2px var(--primary) solid;
  border-radius: 5px;
  transition: 1s ease;
}

.button:hover {
  transform: scale(1.05);
  cursor: pointer;
}

.container {
  display: flex;
  width: min(100% - 2rem, 450px);
  margin-left: auto;
  margin-right: auto;
}

.container > div {
  flex: 1;
  margin: 1rem;
}

.simple {
  text-decoration: none;
  color: white;
}

input,
select,
textarea {
  font-size: 16px !important;
}
</style>
