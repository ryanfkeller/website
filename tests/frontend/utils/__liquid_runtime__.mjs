import { Liquid } from "liquidjs";
const engine = new Liquid({jekyllInclude: true});
let context = {};

export const runtime = {
    setContext: (ctx) => { context = ctx; },

    parseAndRender(snippet) {
        // parse and render with a temporary scope so we can observe assignments
        const scope = { ...context };
        console.log(snippet);

        // console.log(context);
        const nodes = engine.parse(snippet);
        const assignNode = nodes.find(n => n.name === 'assign');

        if (assignNode) {
          const varName = assignNode.key;           // 'vrmsData'
          const valueExpression = assignNode.value; // Value object

          // evaluate expression in context
          const value = engine.evalValue(valueExpression, context);

          console.log(varName); // vrmsData
          console.log(value);   // [1,2,3]

          // optionally, store in runtime context
          context[varName] = value;
        }


        const out = engine.parseAndRenderSync(snippet, context);

        console.log(out);
        return out;
    }
}