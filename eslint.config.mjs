import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
    {
        ignores: [".unlighthouse/**", ".next/**", "node_modules/**"]
    },
    ...nextCoreWebVitals
];

export default config;
