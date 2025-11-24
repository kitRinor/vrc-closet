import { api } from "@/lib/api";
import { InferResponseType } from "hono/client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AuthUser = InferResponseType<typeof api.auth.me.$get, 200>;

// const DUMMY_USER: AuthUser = {
//   id: "00000000-0000-0000-0000-000000000000",
//   handle: "dev",
//   displayName: "Dev User",
//   avatarUrl: "https://github.com/shadcn.png",
// };

type ContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ok: boolean, error?: string}>;
  logout: () => Promise<void>;
};

const Context = createContext<ContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const res = await api.auth.me.$get(); // 認証チェック & ユーザー情報取得
        if (res.ok) {
          const user = await res.json();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Session check failed:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login.$post({ json: { email, password } });
      if (res.ok) {
        const user = await res.json();
        setUser(user);
      } else {
        const { error } = await res.json();
        throw new Error(error || "unknown error");
      }
      setIsLoading(false);
      return {ok: true};
    } catch (e) {
      console.error("Login failed:", e);
      setUser(null);
      setIsLoading(false);
      return {ok: false, error: (e as Error).message};
    } 
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.logout.$put();
      if (res.ok) {
        setUser(null);
      } else {
        const err = await res.text();
        throw new Error(err || "unknown error");
      }
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Context.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}