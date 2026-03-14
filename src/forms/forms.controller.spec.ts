import { FormsController } from './forms.controller'
import { FormsService } from './forms.service'

describe('FormsController', () => {
  let controller: FormsController
  let service: FormsService

  beforeEach(() => {
    service = {
      handleContact: vi.fn(),
      handlePromotion: vi.fn(),
      handleSubscribe: vi.fn(),
    } as any
    controller = new FormsController(service)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
