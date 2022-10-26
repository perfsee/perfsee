export type DeepPartial<T> = T extends Array<infer U>
  ? DeepPartial<U>[]
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends object
  ? {
      [K in keyof T]?: DeepPartial<T[K]>
    }
  : T

export type PathType<T, Path extends string> = string extends Path
  ? unknown
  : Path extends keyof T
  ? T[Path]
  : Path extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? PathType<T[K], R>
    : unknown
  : unknown

type Join<Prefix, Suffixes> = Prefix extends string | number
  ? Suffixes extends string | number
    ? Prefix extends ''
      ? Suffixes
      : `${Prefix}.${Suffixes}`
    : never
  : never

export type PrimitiveType = string | number | boolean | symbol | null | undefined

export type Paths<
  T,
  Path extends string = '',
  MaxDepth extends string = '...',
  Depth extends string = '',
> = Depth extends MaxDepth
  ? never
  : T extends Record<string | number, any>
  ? {
      [K in keyof T]-?: K extends string | number ? K | Join<K, Paths<T[K], Path, MaxDepth, `${Depth}.`>> : never
    }[keyof T]
  : never

export type LeafPaths<
  T,
  Path extends string = '',
  MaxDepth extends string = '...',
  Depth extends string = '',
> = Depth extends MaxDepth
  ? never
  : T extends Record<string | number, any>
  ? {
      [K in keyof T]-?: K extends string | number
        ? T[K] extends PrimitiveType
          ? K
          : Join<K, LeafPaths<T[K], Path, MaxDepth, `${Depth}.`>>
        : never
    }[keyof T]
  : never
