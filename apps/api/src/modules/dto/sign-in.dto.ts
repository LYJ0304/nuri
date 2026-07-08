import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SignInDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MaxLength(128)
    password!: string;
}