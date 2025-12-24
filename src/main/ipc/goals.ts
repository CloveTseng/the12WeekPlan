import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function setupGoalsHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('goals:getProjects', (_, year: number, quarter: number) => {
    try {
      const stmt = db.prepare('SELECT * FROM projects WHERE year = ? AND quarter = ? ORDER BY created_at DESC')
      return stmt.all(year, quarter)
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  })

  ipcMain.handle('goals:createProject', (_, data) => {
    console.log('Received createProject request:', data)
    try {
      const { title, description, tactics, deadline, year, quarter } = data
      
      // Basic validation
      if (!title) throw new Error('Title is required')
      if (!year || !quarter) throw new Error('Year and Quarter are required')

      const stmt = db.prepare(`
        INSERT INTO projects (title, description, tactics, deadline, year, quarter)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      const info = stmt.run(title, description, tactics || '', deadline || null, year, quarter)
      console.log('Project created with ID:', info.lastInsertRowid)
      return { id: info.lastInsertRowid, ...data, created_at: new Date().toISOString() }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  })

  ipcMain.handle('goals:getActions', (_, projectId: number, weekNumber: number) => {
    try {
      const stmt = db.prepare('SELECT * FROM weekly_actions WHERE project_id = ? AND week_number = ? ORDER BY created_at ASC')
      const actions = stmt.all(projectId, weekNumber) as any[]
      return actions.map(action => ({
        ...action,
        is_completed: Boolean(action.is_completed)
      }))
    } catch (error) {
      console.error('Error fetching actions:', error)
      throw error
    }
  })

  ipcMain.handle('goals:getAllActions', (_, projectId: number) => {
    try {
      const stmt = db.prepare('SELECT * FROM weekly_actions WHERE project_id = ? ORDER BY week_number ASC, created_at ASC')
      const actions = stmt.all(projectId) as any[]
      return actions.map(action => ({
        ...action,
        is_completed: Boolean(action.is_completed)
      }))
    } catch (error) {
      console.error('Error fetching all actions:', error)
      throw error
    }
  })

  ipcMain.handle('goals:createAction', (_, data) => {
    try {
      const { project_id, week_number, content } = data
      const stmt = db.prepare(`
        INSERT INTO weekly_actions (project_id, week_number, content, is_completed)
        VALUES (?, ?, ?, 0)
      `)
      const info = stmt.run(project_id, week_number, content)
      return {
        id: info.lastInsertRowid,
        project_id,
        week_number,
        content,
        is_completed: false,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating action:', error)
      throw error
    }
  })

  ipcMain.handle('goals:getMonthlyPlans', (_, projectId: number) => {
    try {
      const stmt = db.prepare('SELECT * FROM monthly_plans WHERE project_id = ? ORDER BY month ASC, created_at ASC')
      const plans = stmt.all(projectId) as any[]
      return plans.map(plan => ({
        ...plan,
        is_primary: Boolean(plan.is_primary)
      }))
    } catch (error) {
      console.error('Error fetching monthly plans:', error)
      throw error
    }
  })

  ipcMain.handle('goals:createMonthlyPlan', (_, data) => {
    try {
      const { project_id, month, content, is_primary } = data
      const stmt = db.prepare(`
        INSERT INTO monthly_plans (project_id, month, content, is_primary)
        VALUES (?, ?, ?, ?)
      `)
      const info = stmt.run(project_id, month, content, is_primary ? 1 : 0)
      return {
        id: info.lastInsertRowid,
        project_id,
        month,
        content,
        is_primary,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating monthly plan:', error)
      throw error
    }
  })

  ipcMain.handle('goals:deleteMonthlyPlan', (_, planId: number) => {
    try {
      const stmt = db.prepare('DELETE FROM monthly_plans WHERE id = ?')
      stmt.run(planId)
      return true
    } catch (error) {
      console.error('Error deleting monthly plan:', error)
      throw error
    }
  })

  ipcMain.handle('goals:toggleMonthlyPlanPrimary', (_, planId: number, isPrimary: boolean) => {
    try {
      const stmt = db.prepare('UPDATE monthly_plans SET is_primary = ? WHERE id = ?')
      stmt.run(isPrimary ? 1 : 0, planId)
      return true
    } catch (error) {
      console.error('Error toggling monthly plan primary status:', error)
      throw error
    }
  })

  ipcMain.handle('goals:toggleAction', (_, actionId: number, isCompleted: boolean) => {
    try {
      const stmt = db.prepare('UPDATE weekly_actions SET is_completed = ? WHERE id = ?')
      stmt.run(isCompleted ? 1 : 0, actionId)
      return true
    } catch (error) {
      console.error('Error toggling action:', error)
      throw error
    }
  })

  ipcMain.handle('goals:deleteAction', (_, actionId: number) => {
    try {
      const stmt = db.prepare('DELETE FROM weekly_actions WHERE id = ?')
      stmt.run(actionId)
      return true
    } catch (error) {
      console.error('Error deleting action:', error)
      throw error
    }
  })

  ipcMain.handle('goals:getCurrentCycle', (_) => {
    try {
      const stmt = db.prepare('SELECT * FROM cycles WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1')
      const cycle = stmt.get()
      if (cycle) {
        return {
          ...cycle,
          is_active: Boolean((cycle as any).is_active)
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching current cycle:', error)
      throw error
    }
  })

  ipcMain.handle('goals:createCycle', (_, data) => {
    try {
      const { title, start_date, end_date, is_active } = data
      
      const transaction = db.transaction(() => {
        if (is_active) {
          db.prepare('UPDATE cycles SET is_active = 0').run()
        }
        
        const stmt = db.prepare(`
          INSERT INTO cycles (title, start_date, end_date, is_active)
          VALUES (?, ?, ?, ?)
        `)
        const info = stmt.run(title, start_date, end_date, is_active ? 1 : 0)
        return {
          id: info.lastInsertRowid,
          title,
          start_date,
          end_date,
          is_active,
          created_at: new Date().toISOString()
        }
      })
      
      return transaction()
    } catch (error) {
      console.error('Error creating cycle:', error)
      throw error
    }
  })

  ipcMain.handle('goals:updateCycle', (_, data) => {
    try {
      const { id, title, start_date, end_date, is_active } = data
      
      const transaction = db.transaction(() => {
        if (is_active) {
          db.prepare('UPDATE cycles SET is_active = 0 WHERE id != ?').run(id)
        }
        
        const updates: string[] = []
        const values: any[] = []
        
        if (title !== undefined) {
          updates.push('title = ?')
          values.push(title)
        }
        if (start_date !== undefined) {
          updates.push('start_date = ?')
          values.push(start_date)
        }
        if (end_date !== undefined) {
          updates.push('end_date = ?')
          values.push(end_date)
        }
        if (is_active !== undefined) {
          updates.push('is_active = ?')
          values.push(is_active ? 1 : 0)
        }
        
        if (updates.length > 0) {
          values.push(id)
          const stmt = db.prepare(`UPDATE cycles SET ${updates.join(', ')} WHERE id = ?`)
          stmt.run(...values)
        }
        
        const updated = db.prepare('SELECT * FROM cycles WHERE id = ?').get(id)
        return {
          ...updated,
          is_active: Boolean((updated as any).is_active)
        }
      })
      
      return transaction()
    } catch (error) {
      console.error('Error updating cycle:', error)
      throw error
    }
  })
}
