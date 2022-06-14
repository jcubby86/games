import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from "axios";

Vue.config.productionTip = false

new Vue({
  data: {
    user: null,
  },
  router,
  methods: {
    async getUser() {
      if (!this.user) {
        try {
          let response = await axios.get("/api/users");
          if (response.data.success) {
            this.user = response.data.user;
          } else {
            this.user = null;
          }
        } catch (error) {
          this.user = null;
          console.log(error);
        }
      }
      return this.user;
    },
  },
  render: h => h(App)
}).$mount('#app')
