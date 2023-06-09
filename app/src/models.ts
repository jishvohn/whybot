export interface Model {
  name: string;
  key: string;
  description: string;
}

export const MODELS: { [key: string]: Model } = {
  "openai/gpt3.5": {
    name: "GPT-3.5",
    key: "gpt-3.5-turbo",
    description: "Fast and semi-smart",
  },
  "openai/gpt4": {
    name: "GPT-4",
    key: "gpt-4",
    description: "Slow but very smart",
  },
};
