import { validate } from 'class-validator'
import { CrearDiagnosticoDto } from './crear-diagnostico.dto'
import { describe, it, expect } from 'vitest'

describe('CrearDiagnosticoDto (Validación)', () => {
  it('debe validar un DTO correcto con todos sus campos', async () => {
    const dto = new CrearDiagnosticoDto()
    dto.name = 'Gabriel Zavando'
    dto.email = 'gabriel@webastro.cl'
    dto.industry = 'Tecnología'
    dto.answers = new Array(15).fill(false)

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('debe detectar un email inválido', async () => {
    const dto = new CrearDiagnosticoDto()
    dto.name = 'Test'
    dto.email = 'formato-incorrecto'
    dto.industry = 'Test'
    dto.answers = new Array(15).fill(true)

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'email')).toBe(true)
  })

  it('debe fallar si answers no tiene exactamente 15 elementos', async () => {
    const dto = new CrearDiagnosticoDto()
    dto.name = 'Test'
    dto.email = 'test@test.com'
    dto.industry = 'Test'
    dto.answers = [true, true] // Solo 2

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'answers')).toBe(true)
  })

  it('debe fallar si answers no son booleanos', async () => {
    const dto = new CrearDiagnosticoDto()
    dto.name = 'Test'
    dto.email = 'test@test.com'
    dto.industry = 'Test'
    dto.answers = new Array(15).fill('not-boolean') as any

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'answers')).toBe(true)
  })
})
