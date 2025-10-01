// next-auth.d.ts

import { UserRole } from "@prisma/client";
import NextAuth, { DefaultSession, DefaultUser, AdapterUser } from "next-auth"; // Importe AdapterUser
import { JWT, DefaultJWT } from "next-auth/jwt";

// Estendendo os tipos do JWT
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
  }
}

// Estendendo os tipos da Sessão, do Usuário e do AdapterUser
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole; // A sessão FINAL terá a role
    } & DefaultSession["user"];
  }

  // Adicione a role opcional aqui para o objeto User principal
  interface User extends DefaultUser {
    role?: UserRole; // Torne opcional
  }
}

// Estenda o AdapterUser também, que é o tipo usado internamente pelo adapter
declare module "next-auth/adapters" {
    interface AdapterUser extends User {
        role?: UserRole; // Torne opcional
    }
}