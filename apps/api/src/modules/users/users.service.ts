import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {email}
        });
    }

    findById(id: string) {
        return this.prisma.user.findUnique({
            where: {id},
            select: {
                id: true,
                email: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async create(email: string, passwordHash: string) {
        const existingUser = await this.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('Email is already in use');
        }

        return this.prisma.user.create({
            data: {
                email,
                passwordHash,
            },
        });
    }
}