import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController
  let appService: AppService

  beforeEach(() => {
    appService = {
      getHello: vi.fn().mockReturnValue('Hello World!'),
    } as any
    appController = new AppController(appService)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!')
    })
  })

  describe('health', () => {
    it('debe retornar status ok con timestamp', () => {
      const result = appController.healthCheck()
      expect(result.status).toBe('ok')
      expect(result.timestamp).toBeDefined()
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
    })
  })
})
