import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const member = await prisma.members.findFirst({
          where: { email: credentials.email as string },
        });

        if (!member || !member.password) return null;

        // Try bcrypt first, then plain text (legacy PHP compatibility)
        let isValid = false;
        try {
          isValid = compareSync(credentials.password as string, member.password);
        } catch {
          // bcrypt may throw on non-hash strings
        }

        if (!isValid) {
          if (credentials.password !== member.password) return null;
        }

        // Update login count
        await prisma.members.update({
          where: { id: member.id },
          data: { num_of_logins: { increment: 1 } },
        });

        return {
          id: String(member.id),
          email: member.email!,
          name: member.name || "",
          isAdmin: false, // TODO: check admin flag
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin || false;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        // Find or create member for OAuth login
        const existingMember = await prisma.members.findFirst({
          where: { email: user.email! },
        });

        if (!existingMember) {
          const newMember = await prisma.members.create({
            data: {
              email: user.email!,
              name: user.name || "",
              password: "", // OAuth users don't need password
              is_verified: true,
              date_signedup: new Date(),
            },
          });
          user.id = String(newMember.id);
        } else {
          user.id = String(existingMember.id);
        }
      }
      return true;
    },
  },
});
