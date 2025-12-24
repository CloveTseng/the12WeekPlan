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

  ipcMain.handle('goals:updateProject', (_, data) => {
    try {
      const { id, title, description, deadline, note } = data
      const stmt = db.prepare(`
        UPDATE projects 
        SET title = ?, description = ?, deadline = ?, note = ?
        WHERE id = ?
      `)
      stmt.run(title, description, deadline || null, note || null, id)
      return true
    } catch (error) {
      console.error('Error updating project:', error)
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
      const { project_id, week_number, content, due_date, priority } = data
      const stmt = db.prepare(`
        INSERT INTO weekly_actions (project_id, week_number, content, due_date, priority, is_completed)
        VALUES (?, ?, ?, ?, ?, 0)
      `)
      const info = stmt.run(project_id, week_number, content, due_date || null, priority || 'none')
      return {
        id: info.lastInsertRowid,
        project_id,
        week_number,
        content,
        due_date: due_date || undefined,
        priority: priority || 'none',
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

  ipcMain.handle('goals:updateAction', (_, data) => {
    try {
      const { id, content, due_date, priority, week_number } = data
      
      // Build dynamic SQL based on provided fields
      const updates: string[] = []
      const values: any[] = []
      
      if (content !== undefined) {
        updates.push('content = ?')
        values.push(content)
      }
      if (due_date !== undefined) {
        updates.push('due_date = ?')
        values.push(due_date || null)
      }
      if (priority !== undefined) {
        updates.push('priority = ?')
        values.push(priority || 'none')
      }
      if (week_number !== undefined) {
        updates.push('week_number = ?')
        values.push(week_number)
      }
      
      if (updates.length === 0) return true
      
      values.push(id)
      const stmt = db.prepare(`UPDATE weekly_actions SET ${updates.join(', ')} WHERE id = ?`)
      stmt.run(...values)
      return true
    } catch (error) {
      console.error('Error updating action:', error)
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

  // Plan Cycle Handlers
  ipcMain.handle('goals:getCurrentCycle', () => {
    try {
      const stmt = db.prepare('SELECT * FROM plan_cycles WHERE is_active = 1 LIMIT 1')
      const cycle = stmt.get() as any
      if (!cycle) {
        // If no active cycle, find the latest one
        const latestStmt = db.prepare('SELECT * FROM plan_cycles ORDER BY created_at DESC LIMIT 1')
        const latest = latestStmt.get() as any
        if (latest) {
          return { ...latest, is_active: Boolean(latest.is_active) }
        }
        return null
      }
      return { ...cycle, is_active: Boolean(cycle.is_active) }
    } catch (error) {
      console.error('Error fetching current cycle:', error)
      throw error
    }
  })

  ipcMain.handle('goals:createCycle', (_, data) => {
    try {
      const { title, start_date, end_date } = data
      
      // Deactivate other cycles
      db.prepare('UPDATE plan_cycles SET is_active = 0').run()

      const stmt = db.prepare(`
        INSERT INTO plan_cycles (title, start_date, end_date, is_active)
        VALUES (?, ?, ?, 1)
      `)
      const info = stmt.run(title, start_date, end_date)
      return {
        id: info.lastInsertRowid,
        title,
        start_date,
        end_date,
        is_active: true,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating cycle:', error)
      throw error
    }
  })

  ipcMain.handle('goals:updateCycle', (_, data) => {
    try {
      const { id, title, start_date, end_date } = data
      const stmt = db.prepare(`
        UPDATE plan_cycles 
        SET title = ?, start_date = ?, end_date = ?
        WHERE id = ?
      `)
      stmt.run(title, start_date, end_date, id)
      return { id, title, start_date, end_date }
    } catch (error) {
      console.error('Error updating cycle:', error)
      throw error
    }
  })
}
