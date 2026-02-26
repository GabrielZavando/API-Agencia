import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';
}
