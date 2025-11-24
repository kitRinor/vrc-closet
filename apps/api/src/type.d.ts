export type AppEnv = Env & {
  Variables: {
    userId: string | null;
  };
  Bindings: {}; 
};