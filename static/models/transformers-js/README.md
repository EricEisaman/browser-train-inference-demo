# Browser Train decoder (Transformers.js)

Load locally with `@huggingface/transformers`:

```js
import { env, AutoTokenizer, AutoModelForCausalLM } from '@huggingface/transformers';
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/'; // parent of this folder
const tokenizer = await AutoTokenizer.from_pretrained('transformers-js');
const model = await AutoModelForCausalLM.from_pretrained('transformers-js', { dtype: 'fp32' });
```

See `examples/browser-train-infer-tjs` for a minimal demo.
