export class UserDto {
  id: string;
  email: string;
  name: string;
  device_tokens: string[];
  preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
  };
}
