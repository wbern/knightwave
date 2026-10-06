import {runBrowserChecks,layouts} from './playcheck.mjs';
await runBrowserChecks(layouts.filter(layout=>layout.phone));
