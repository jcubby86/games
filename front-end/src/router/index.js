import Vue from 'vue'
import VueRouter from 'vue-router'
import JoinView from '../views/JoinView.vue'
import HomeView from '../views/HomeView.vue'
import CreateGame from '../views/CreateGame.vue'
import StoryView from '../views/StoryView.vue'
import NamesView from '../views/NamesView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/join/:code?',
    name: 'join',
    component: JoinView
  },
  {
    path: '/create',
    name: 'create',
    component: CreateGame
  },
  {
    path: '/story',
    name: 'story',
    component: StoryView
  },
  {
    path: '/names',
    name: 'names',
    component: NamesView
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
