import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { Public } from '../decorators/public.decorator'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('sign-up')
    signUp(@Body() dto: SignUpDto) {
        return this.authService.signUp(dto);
    }

    @Public()
    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@CurrentUser() user: AuthenticatedUser) {
        return user;
    }

}