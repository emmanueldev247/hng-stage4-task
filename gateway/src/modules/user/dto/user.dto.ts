import { UserResponse } from './user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'c3f23a42-9e32-4f02-96a8-b4f1a5a3f6a2',
  })
  user_id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Timestamp when the user record was created',
    example: '2025-11-12T20:45:31.000Z',
    type: String,
    format: 'date-time',
  })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when the user record was last updated',
    example: '2025-11-12T21:15:42.000Z',
    type: String,
    format: 'date-time',
  })
  updated_at: string;
}

export class UserResponseDto extends UserResponse {
  data: UserDto;
}
