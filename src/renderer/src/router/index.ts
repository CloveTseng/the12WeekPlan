import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import GoalsStrategy from '../views/GoalsStrategy.vue'
import WeeklyPlan from '../views/WeeklyPlan.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/goals',
      name: 'goals',
      component: GoalsStrategy
    },
    {
      path: '/weekly-plan',
      name: 'weekly-plan',
      component: WeeklyPlan
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    }
  ]
})

export default router
