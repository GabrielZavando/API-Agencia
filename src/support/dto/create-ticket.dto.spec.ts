import { validate } from 'class-validator'
import { CreateTicketDto } from './create-ticket.dto'
import { describe, it, expect } from 'vitest'

describe('CreateTicketDto (Validación)', () => {
  it('debe validar un DTO correcto con todos sus campos', async () => {
    const dto = new CreateTicketDto()
    dto.subject = 'Soporte Técnico'
    dto.message = 'No se puede ver el reporte de marzo'
    dto.projectId = 'project-123'
    dto.projectName = 'WebAstro Enterprise'
    dto.priority = 'high'

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('debe fallar si faltan campos obligatorios', async () => {
    const dto = new CreateTicketDto()

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((e) => e.property === 'subject')).toBe(true)
    expect(errors.some((e) => e.property === 'message')).toBe(true)
  })

  it('debe fallar si la prioridad no es válida', async () => {
    const dto = new CreateTicketDto()
    dto.subject = 'Soporte'
    dto.message = 'Test'
    dto.projectId = 'p-1'
    dto.projectName = 'P-1'
    dto.priority = 'critical' as any

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'priority')).toBe(true)
  })
})
