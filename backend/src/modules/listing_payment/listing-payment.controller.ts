import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';
import { CreateListingPaymentOrderDto } from './dto/create-listing-payment-order.dto';
import { ListingPaymentService } from './listing-payment.service';
import type { MomoIpnPayload } from './listing-payment.service';
import { RejectBankTransferDto } from './dto/reject-bank-transfer.dto';

@Controller('listing-payments')
export class ListingPaymentController {
  constructor(private readonly paymentService: ListingPaymentService) {}

  @Roles(UserRole.USER)
  @Get('preview')
  preview(
    @Req() req: RequestWithUser,
    @Query('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.paymentService.preview(req.user.id, categoryId);
  }

  @Roles(UserRole.USER)
  @Post('orders')
  createOrder(
    @Req() req: RequestWithUser,
    @Body() dto: CreateListingPaymentOrderDto,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    return this.paymentService.createOrder(req.user.id, dto, ipAddress);
  }

  @Roles(UserRole.USER)
  @Get('orders/:id')
  findMine(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.paymentService.findMine(req.user.id, id);
  }

  @Roles(UserRole.USER)
  @Get('orders')
  findMyOrders(@Req() req: RequestWithUser) {
    return this.paymentService.findMyOrders(req.user.id);
  }

  @Roles(UserRole.USER)
  @Patch('orders/:id/submit-bank-transfer')
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  submitBankTransfer(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    return this.paymentService.submitBankTransfer(req.user.id, id, receipt);
  }

  @Public()
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, string>) {
    const result = await this.paymentService.handleVnpayResult(query);
    return { RspCode: result.code, Message: result.message };
  }

  @Public()
  @Get('vnpay/return')
  vnpayReturn(@Query() query: Record<string, string>) {
    return this.paymentService.handleVnpayResult(query);
  }

  @Public()
  @Post('momo/ipn')
  @HttpCode(204)
  async momoIpn(@Body() payload: MomoIpnPayload) {
    await this.paymentService.handleMomoIpn(payload);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/revenue-summary')
  getRevenueSummary() {
    return this.paymentService.getRevenueSummary();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/revenue-trends')
  getRevenueTrends(@Query('range') range?: string) {
    return this.paymentService.getRevenueTrends(range);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/orders')
  findForAdmin() {
    return this.paymentService.findForAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Patch('orders/:id/confirm-bank-transfer')
  confirmBankTransfer(@Param('id') id: string) {
    return this.paymentService.confirmBankTransfer(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('orders/:id/reject-bank-transfer')
  rejectBankTransfer(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RejectBankTransferDto,
  ) {
    return this.paymentService.rejectBankTransfer(id, req.user.id, dto.reason);
  }
}
