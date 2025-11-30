// Guidance for using Google Earth Engine in Node.js/TypeScript
// 1. There is no official @types/google\_\_earthengine package on npm.
// 2. Use the official client: https://developers.google.com/earth-engine/guides/node_setup
// npm install @google/earthengine
// 3. For TypeScript, use a custom type declaration (see types/google.earthengine.d.ts)
// 4. As a workaround, you can use 'any' for ee objects in your code.
// 5. Example import:
// import ee from '@google/earthengine';
// // or declare ee: any if types are missing
// 6. For more advanced typing, extend the custom types as needed.
