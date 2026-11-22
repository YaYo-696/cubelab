const base = import.meta.env.BASE_URL;
export const storageScope = base === '/' ? 'cubelab' : 'cubelab:' + base;
export const storageKey = (name: string) => storageScope + '.' + name;
