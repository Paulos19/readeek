// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { User, UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          return null;
        }
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordCorrect) {
          return null;
        }
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // 1. O callback JWT agora recebe um novo parâmetro 'trigger' e 'session'
    async jwt({ token, user, trigger, session }) {
      // No login inicial, o objeto 'user' existe.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.credits = user.credits;
      }

      // *** INÍCIO DA CORREÇÃO PRINCIPAL ***
      // Se a sessão foi atualizada (pela função update() no cliente),
      // o 'trigger' será "update" e os novos dados estarão em 'session'.
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      // *** FIM DA CORREÇÃO PRINCIPAL ***

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role ?? UserRole.USER;
        session.user.credits = token.credits ?? 0;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };