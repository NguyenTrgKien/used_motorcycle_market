import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, Req } from '@nestjs/common';
import { type Request } from 'express';
import { User } from '../user/entities/user.entity';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Roles(UserRole.USER)
  create(@Req() req: Request & { user: User }, @Body() createReportDto: CreateReportDto) {
    return this.reportService.create(req.user.id, createReportDto);
  }

  @Get('my')
  @Roles(UserRole.USER)
  findMine(@Req() req: Request & { user: User }, @Query() query: Record<string, string | undefined>) {
    return this.reportService.findMine(req.user.id, query);
  }

  @Get('my/:id')
  @Roles(UserRole.USER)
  findMineOne(@Req() req: Request & { user: User }, @Param('id', ParseIntPipe) id: number) {
    return this.reportService.findMineOne(req.user.id, id);
  }

  @Get('status')
  @Roles(UserRole.USER)
  getStatus(
    @Req() req: Request & { user: User },
    @Query('targetType') targetType: string,
    @Query('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.reportService.getStatus(req.user.id, targetType, targetId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CSKH)
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.reportService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CSKH)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CSKH)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateReportDto: UpdateReportDto) {
    return this.reportService.update(id, updateReportDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reportService.remove(id);
  }
}
