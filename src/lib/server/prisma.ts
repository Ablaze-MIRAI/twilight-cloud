//import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@prisma/client";

class PrismaRepository extends PrismaClient {
    /*
    2025/06/05: 登録時に外部キー制約エラーが出るバグがあるため保留

    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        super({ adapter });
    }
    */

    async onModuleInit() {
        await this.$connect();
    }
}

const prisma = new PrismaRepository();

export const userRepository = prisma.user;
export type IUserRepository = typeof userRepository

export const passkeyRepository = prisma.passkey;
export type IPasskeyRepository = typeof passkeyRepository

export const noteRepository = prisma.note;
export type INoteRepository = typeof noteRepository

export const noteCategoryRepository = prisma.noteCategory;
export type INoteCategoryRepository = typeof noteCategoryRepository
