import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { authConfig } from "./auth.config";
import { eq } from "drizzle-orm";

export const authOptions = {
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string") {
          return null;
        }

        const email = credentials.email;

        // Find or create user for demo purposes
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          const result = await db
            .insert(users)
            .values({ email, name: email.split("@")[0] })
            .returning();
          user = result[0];
        }

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
