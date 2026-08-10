import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Roles(UserRole.ADMIN)
  @Get('stats')
  getStats() {
    return this.adminDashboardService.getStats();
  }

  @Roles(UserRole.ADMIN)
  @Get('trends')
  getTrends(@Query('range') range?: string) {
    return this.adminDashboardService.getTrends(range);
  }
}
