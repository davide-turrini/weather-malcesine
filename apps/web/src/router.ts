import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import StationDetail from '@/views/StationDetail.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/stazione/:id', name: 'station', component: StationDetail },
  ],
})
