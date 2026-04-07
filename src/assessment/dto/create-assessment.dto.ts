import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator'

export class CreateAssessmentDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  industry: string

  @IsArray()
  @ArrayMinSize(12)
  @ArrayMaxSize(12)
  @IsBoolean({ each: true })
  answers: boolean[]

  @IsOptional()
  @IsString()
  turnstileToken?: string
}
