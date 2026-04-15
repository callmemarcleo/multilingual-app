/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";

import db from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { schema } from "@/lib/schema";
import bcrypt from "bcrypt";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const adapter = PrismaAdapter(db);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedCredentials = schema.parse(credentials);

        const user = await db.user.findUnique({
          where: {
            email: validatedCredentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials.");
        }

        const isValid = await bcrypt.compare(
          validatedCredentials.password,
          user.password
        );
        if (!isValid) {
          throw new Error("Invalid credentials.");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const fallbackUsername = profile?.email
          ? profile.email.split("@")[0]
          : `googleuser_${uuid().slice(0, 8)}`;
        (user as any).username = fallbackUsername;

        const fullName = profile?.name || "";
        const [first, ...rest] = fullName.split(" ");
        const last = rest.join(" ");
        (user as any).firstname = first || "";
        (user as any).lastname = last || "";
      }
      if (account?.provider === "github") {
        const fallbackUsername = profile?.email
          ? profile.email.split("@")[0]
          : `githubuser_${uuid().slice(0, 8)}`;
        (user as any).username = fallbackUsername;

        const fullName = profile?.name || "";
        const [first, ...rest] = fullName.split(" ");
        const last = rest.join(" ");
        (user as any).firstname = first || "";
        (user as any).lastname = last || "";
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});
