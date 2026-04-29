// src/types/next-auth.d.ts
// 擴充 Session 型別，加入 user.id

import "next-auth";

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
