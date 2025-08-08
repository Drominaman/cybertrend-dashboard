declare module 'papaparse' {
  const Papa: any;
  export default Papa;
}

declare namespace Papa {
  interface ParseError { message: string }
  interface ParseMeta { fields?: string[] }
  interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }
}

declare module 'react' {
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => any, deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initial: T): { current: T };
  export function useCallback<T extends (...args: any) => any>(callback: T, deps: any[]): T;
  export function createElement(type: any, props: any, ...children: any[]): any;
  export const Fragment: any;
  export const StrictMode: any;
  const React: any;
  export default React;
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module 'react/jsx-runtime' {
  const jsxRuntime: any;
  export default jsxRuntime;
}

declare namespace React {
  interface FC<P = any> {
    (props: P): any;
  }
  interface ChangeEvent<T = any> extends Event {
    target: T;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface ImportMetaEnv {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
