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

export class CrearDiagnosticoDto {
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
  @ArrayMinSize(15)
  @ArrayMaxSize(15)
  @IsBoolean({ each: true })
  answers: boolean[]

  @IsOptional()
  @IsString()
  turnstileToken?: string
}
