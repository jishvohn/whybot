export interface Model {
    name: string;
    key: string;
    description: string;
}

export const MODELS: { [key: string]: Model } = {
    "openai/gpt4.0.mini": {
        name: "GPT-4.0 Mini",
        key: "gpt-4o-mini",
        description: "Fast and semi-smart",
    },
    "openai/gpt4": {
        name: "GPT-4",
        key: "gpt-4",
        description: "Slow but very smart",
    },
};
