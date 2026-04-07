import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proyecto es requerido' })
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  clientId: string

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  monthlyTicketLimit?: number

  @IsString()
  @IsOptional()
  status?: string

  @IsNumber()
  @IsOptional()
  percentage?: number
}
