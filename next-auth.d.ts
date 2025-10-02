// next-auth.d.ts

import { UserRole } from "@prisma/client";
import NextAuth, { DefaultSession, DefaultUser, AdapterUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role?: UserRole;      // Alterado para opcional
    credits?: number;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;      // Mantido como obrigatório no objeto final da sessão
      credits: number;     // Mantido como obrigatório no objeto final da sessão
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: UserRole;
    credits?: number;
  }
}

declare module "next-auth/adapters" {
    interface AdapterUser extends User {
        role?: UserRole;
        credits?: number;
    }
}