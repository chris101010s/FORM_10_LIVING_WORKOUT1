import parser from '@typescript-eslint/parser';
import typescript from '@typescript-eslint/eslint-plugin';

// Defect-oriented lint gate: formatting and legacy naming are deliberately not release gates.
const defects = {
  'constructor-super':'error', 'for-direction':'error', 'getter-return':'error',
  'no-async-promise-executor':'error', 'no-compare-neg-zero':'error', 'no-cond-assign':['error','except-parens'],
  'no-constant-binary-expression':'error', 'no-constant-condition':['error',{checkLoops:'allExceptWhileTrue'}],
  'no-dupe-args':'error', 'no-dupe-else-if':'error', 'no-duplicate-case':'error',
  'no-empty-character-class':'error', 'no-ex-assign':'error', 'no-func-assign':'error',
  'no-invalid-regexp':'error', 'no-loss-of-precision':'error', 'no-new-native-nonconstructor':'error',
  'no-obj-calls':'error', 'no-promise-executor-return':'error', 'no-self-assign':'error',
  'no-self-compare':'error', 'no-sparse-arrays':'error', 'no-this-before-super':'error',
  'no-unexpected-multiline':'error', 'no-unreachable':'error', 'no-unsafe-finally':'error',
  'no-unsafe-negation':'error', 'use-isnan':'error', 'valid-typeof':'error'
};
const jsxDefects={rules:{'no-duplicate-props':{meta:{type:'problem',schema:[],messages:{duplicate:'Duplicate JSX property {{name}}.'}},create(context){return {JSXOpeningElement(node){const seen=new Set();for(const attribute of node.attributes){if(attribute.type!=='JSXAttribute')continue;const name=context.sourceCode.getText(attribute.name);if(seen.has(name))context.report({node:attribute,messageId:'duplicate',data:{name}});seen.add(name);}}};}}}};
export default [
  {ignores:['node_modules/**','ios/**','android/**','artifacts/**','dist/**','.expo/**']},
  {files:['**/*.{js,cjs,mjs,ts,tsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module'},rules:defects},
  {files:['**/*.cjs'],languageOptions:{sourceType:'commonjs'}},
  {files:['**/*.{ts,tsx}'],languageOptions:{parser,parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{'@typescript-eslint':typescript,'form-jsx':jsxDefects},rules:{'@typescript-eslint/no-duplicate-enum-values':'error','form-jsx/no-duplicate-props':'error'}}
];
