import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum TimePeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export class QueryRevenueDto {
  @ApiPropertyOptional({ enum: TimePeriod, default: TimePeriod.MONTH, description: 'Lọc doanh thu theo: DAY, WEEK, MONTH, YEAR' })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.MONTH;
}