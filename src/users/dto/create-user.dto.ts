export class CreateUserDto {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'client';
}
