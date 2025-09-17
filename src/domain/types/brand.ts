export type Brand<T, U extends symbol> = T & { readonly [K in U]: never };
