import { expect, it } from 'vitest'
import { BadRequestException } from '@nestjs/common'

it('should find BadRequestException', () => {
  console.log('DEBUG: BadRequestException in simple test:', BadRequestException)
  expect(BadRequestException).toBeDefined()
})
