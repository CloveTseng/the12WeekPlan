import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  goals: {
    getProjects: (year: number, quarter: number) => ipcRenderer.invoke('goals:getProjects', year, quarter),
    createProject: (data: any) => ipcRenderer.invoke('goals:createProject', data),
    getActions: (projectId: number, weekNumber: number) => ipcRenderer.invoke('goals:getActions', projectId, weekNumber),
    getAllActions: (projectId: number) => ipcRenderer.invoke('goals:getAllActions', projectId),
    createAction: (data: any) => ipcRenderer.invoke('goals:createAction', data),
    updateAction: (actionId: number, data: any) => ipcRenderer.invoke('goals:updateAction', actionId, data),
    toggleAction: (actionId: number, isCompleted: boolean) => ipcRenderer.invoke('goals:toggleAction', actionId, isCompleted),
    deleteAction: (actionId: number) => ipcRenderer.invoke('goals:deleteAction', actionId),
    getMonthlyPlans: (projectId: number) => ipcRenderer.invoke('goals:getMonthlyPlans', projectId),
    createMonthlyPlan: (data: any) => ipcRenderer.invoke('goals:createMonthlyPlan', data),
    deleteMonthlyPlan: (planId: number) => ipcRenderer.invoke('goals:deleteMonthlyPlan', planId),
    toggleMonthlyPlanPrimary: (planId: number, isPrimary: boolean) => ipcRenderer.invoke('goals:toggleMonthlyPlanPrimary', planId, isPrimary),
    getCurrentCycle: () => ipcRenderer.invoke('goals:getCurrentCycle'),
    createCycle: (data: any) => ipcRenderer.invoke('goals:createCycle', data),
    updateCycle: (data: any) => ipcRenderer.invoke('goals:updateCycle', data)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
