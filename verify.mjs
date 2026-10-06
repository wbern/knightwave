import {runBrowserChecks,layouts} from './playcheck.mjs';
await runBrowserChecks(layouts.filter(layout=>['desktop','phone'].includes(layout.name)));
