import { env } from '@huggingface/transformers';

/** Local Hub-style packages under static/models/<id>/ */
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';
