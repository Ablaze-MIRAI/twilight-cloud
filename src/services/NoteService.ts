import type { NoteTree } from "$lib/schema/note";
import type { Note, NoteCategory } from "@prisma/client";

import type { INoteCategoryRepository, INoteRepository } from "@/prisma";


export class NoteService {
    constructor(
        private readonly noteRepository: INoteRepository,
        private readonly noteCategoryRepository: INoteCategoryRepository
    ) {}

    public async createNote(uid: string, title: string, content: string, categoryId: string): Promise<string> {
        const created = await this.noteRepository.create({
            data: {
                user: {
                    connect: { id: uid }
                },
                title: title,
                content: content,
                category: {
                    connect: {
                        id: categoryId,
                        userId: uid
                    }
                }
            }
        });

        return created.id;
    }

    public async getNoteById(uid: string, noteId: string): Promise<Note | null> {
        const found = await this.noteRepository.findUnique({
            where: {
                id: noteId,
                userId: uid
            }
        });

        if (!found) {
            return null;
        }

        if (found?.userId !== uid) {
            // 何かのバグでuidがundefinedになった場合など
            throw new Error("Integrity check failed: may be caused by bug(s) or leak of credentials");
        }

        return found;
    }

    public async updateNoteById(uid: string, noteId: string, title: string, content: string): Promise<boolean> {
        if (!uid) {
            throw new Error("Integrity check failed: may be caused by bug(s) or leak of credentials");
        }

        const updated = await this.noteRepository.update({
            where: {
                id: noteId,
                userId: uid
            },
            data: {
                title: title,
                content: content
            }
        });

        return updated !== null;
    }

    public async deleteNoteById(uid: string, noteId: string): Promise<boolean> {
        const deleted = await this.noteRepository.delete({
            where: {
                id: noteId,
                userId: uid
            }
        });

        return deleted !== null;
    }

    public async getNoteTreeByUserId(uid: string): Promise<NoteTree[]> {
        const tree = await this.noteCategoryRepository.findMany({
            where: { userId: uid },
            select: {
                id: true,
                name: true,
                iconName: true,
                notes: {
                    select: {
                        id: true,
                        userId: true,
                        title: true,
                        createdAt: true
                    }
                }
            }
        });

        for (const category of tree) {
            for (const note of category.notes) {
                if (note.userId !== uid) {
                    throw new Error("Integrity check failed: may be caused by bug(s) or leak of credentials");
                }
            }
        }

        return tree;
    }

    public async createNoteCategory(uid: string, categoryName: string, iconName: string): Promise<string> {
        if (!uid) {
            throw new Error("Integrity check failed: may be caused by bug(s) or leak of credentials");
        }

        const created = await this.noteCategoryRepository.create({
            data: {
                user: {
                    connect: { id: uid }
                },
                name: categoryName,
                iconName:  iconName
            }
        });

        return created.id;
    }

    public async getNoteCategoriesByUserId(uid: string): Promise<NoteCategory[]> {
        const found = await this.noteCategoryRepository.findMany({
            where: { userId: uid }
        });

        for (const category of found) {
            if (category.userId !== uid) {
                throw new Error("Integrity check failed: may be caused by bug(s) or leak of credentials");
            }
        }

        return found;
    }
}
