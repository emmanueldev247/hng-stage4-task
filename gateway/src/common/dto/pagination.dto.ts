import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 120, description: 'Total number of items available' })
  total: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 2, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 12, description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ example: true, description: 'Indicates if next page exists' })
  has_next: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if previous page exists',
  })
  has_previous: boolean;

  constructor(total: number, limit: number, page: number) {
    this.total = total;
    this.limit = limit;
    this.page = page;
    this.total_pages = Math.ceil(total / limit);
    this.has_next = page < this.total_pages;
    this.has_previous = page > 1;
  }
}
