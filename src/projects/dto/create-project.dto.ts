export class CreateProjectDto {
  name: string;
  description?: string;
  clientId: string;
  monthlyTicketLimit: number;
}
