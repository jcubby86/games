<template>
  <div id="app">
    <div class="header">
      <router-link class="simple" to="/"> Games </router-link>
    </div>
    <div class="main">
      <router-view/>
    </div>
    <div class="footer" v-if="user">
      <div class="left">{{user.nickname}}
      </div>
      <div class="right">code: {{user.game.code}}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    user() {
      return this.$root.$data.user;
    }
  }
};
</script>

<style>
:root {
  --lightest: #ADD7F6;
  --lighter: #87BFFF;
  --primary: #3F8EFC;
  --darker: #2667FF;
  --darkest: #3B28CC;
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
  position:fixed;
  bottom: 0;
  left: 0;
  height: 30px;
  width: 100%;
  background-color: var(--darkest);
  height: 30px;
}

.left, .right {
  margin: 5px;
  position: fixed;
  color: white;
}

.left {
  left: 0;
}
.right {
  right: 0;
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
  width: min(100% - 2rem, 500px);
  margin-inline: auto;
}

.container > div {
  flex: 1;
  margin: 1rem;
}

.simple {
  text-decoration: none;
  color: white;
}

</style>
