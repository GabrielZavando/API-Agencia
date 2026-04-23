import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AssessmentService } from './assessment.service'
import { CreateAssessmentDto } from './dto/create-assessment.dto'
import { AssessmentDiagnosisResult } from './dto/assessment-response.dto'

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() dto: CreateAssessmentDto,
  ): Promise<AssessmentDiagnosisResult> {
    const diagnosis = await this.assessmentService.processAndDeliver(dto)

    return {
      success: true,
      diagnosis,
    }
  }
}
