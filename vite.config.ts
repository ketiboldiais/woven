import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkSectionize from 'remark-sectionize';
import remarkMath from 'remark-math';
import remarkGFM from 'remark-gfm';
import rehypeKatex from 'rehype-katex';


export default defineConfig({
  plugins: [
    react(),
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [
        remarkSectionize,
        remarkMath,
        remarkGFM,
      ],
      rehypePlugins: [
        rehypeKatex
      ]
    }),
  ],
});
