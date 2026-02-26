import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['open', 'in-progress', 'resolved'])
  status?: 'open' | 'in-progress' | 'resolved';

  @IsOptional()
  @IsString()
  adminResponse?: string;
}
