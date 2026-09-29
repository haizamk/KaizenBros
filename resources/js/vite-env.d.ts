interface ImportMetaGlob {
  (pattern: string, options?: { eager?: boolean }): Record<string, any>;
}

interface ImportMeta {
  readonly glob: ImportMetaGlob;
}
