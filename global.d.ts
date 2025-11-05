declare namespace NodeJS  {
    interface RequireFunction {
      context(directory: string, useSubdirectories: boolean, regExp: RegExp): { id: string }[];
    }
  }