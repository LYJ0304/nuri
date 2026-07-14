import  { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserService } from '../users/users.service';
import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    async signUp(dto: SignUpDto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const passwordHash = await argon2.hash(dto.password);

        const user = await this.userService.create(
            normalizedEmail,
            passwordHash,
        );

        return {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        };
    }

    async signIn(dto: SignInDto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.userService.findByEmail(normalizedEmail);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await argon2.verify(
            user.passwordHash,
            dto.password,
        );

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedException('Account is not active');
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
            },
        };

    }

}
