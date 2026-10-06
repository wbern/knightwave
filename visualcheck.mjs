import {runBrowserChecks,layouts} from './playcheck.mjs';
const selected=process.env.KNIGHTWAVE_LAYOUTS?.split(',');
await runBrowserChecks(layouts.filter(layout=>!selected||selected.includes(layout.name)));
