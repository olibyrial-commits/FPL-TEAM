import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        Credentials({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "test@example.com" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                const user = {
                    id: `test-${Date.now()}`,
                    name: "Test User",
                    email: credentials.email,
                    tier: "free",
                };
                return user;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                // @ts-ignore
                session.user.id = token.sub;
                // @ts-ignore
                session.user.tier = token.tier || "free";
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                // @ts-ignore
                token.tier = user.tier;
            }
            return token;
        },
    },
    pages: {
        signIn: "/login",
    },
};
