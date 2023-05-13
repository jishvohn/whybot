import { QATree, QATreeNode, ScoredQuestion } from "./GraphPage";

const QUESTIONS_FORMAT_EXPLANATION = `
For each follow-up question, provide a numeric score from 1 to 10 rating how interesting the question may be to the asker of the original question. Format your answer as a JSON array like this: [{"question": "...", "score": 1}, {"question": "...", "score": 2}, ...]
For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10}]`;

interface WithGetPromptForQuestions {
  getPromptForQuestions(node: QATreeNode, tree: QATree): string;
}

interface WithGetQuestions {
  getQuestions(node: QATreeNode, tree: QATree): ScoredQuestion[];
}

export type Persona = {
  name: string;
  description: string;
  promptForRandomQuestion: string;
  getPromptForAnswer(node: QATreeNode, tree: QATree): string;
} & (WithGetPromptForQuestions | WithGetQuestions);

export const PERSONAS: { [key: string]: Persona } = {
  auto: {
    name: "Auto",
    description:
      "Adaptively asks questions that it thinks you might be interested in",
    promptForRandomQuestion:
      "Write a random but interesting 'why' question. Only write the question, with no quotes.",
    getPromptForAnswer: (node, tree) => {
      if (!node.parent) {
        return `${node.question}`;
      }
      const parentNode = tree[node.parent];
      if (parentNode == null) {
        throw new Error(`Parent node ${node.parent} not found`);
      }

      return `
      You were previously asked this question: ${parentNode.question}
      You responded with this answer: ${parentNode.answer}
      Given that context, please provide a short & concise answer to this follow up question: ${node.question}`;
    },
    getPromptForQuestions: (node) => {
      return `Given a question/answer pair, generate a likely persona who asked 
            that question. And then pretend you are that persona and write the most interesting 1-2 follow-up questions that this persona would enjoy learning about the most.  For each follow-up question, provide the persona summary & a numeric score from 1 to 10 rating how interesting the question may be to your persona. Format your answer as a JSON array like this: [{"question": "...", "score": 1, "persona_summary": "..."}, {"question": "...", "score": 2, "persona_summary": "..."}, ...]
            
            Your number 1 priority is to generate the most interesting questions that help your generated persona the most.
            
            Question: ${node.question}
            Information/Answer to the question: ${node.answer}
            
            For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10, "persona_summary": "Young man thinking about the scientific nature of the universe and our planet"}]
            Your answer: `;
    },
  },
  researcher: {
    name: "Researcher",
    description: "Asks lots of interesting 'why'-type follow-up questions",
    promptForRandomQuestion:
      "Write a random but interesting 'why' question that a researcher may ask. Only write the question, with no quotes.",
    getPromptForAnswer: (node, tree) => {
      if (!node.parent) {
        return `${node.question}`;
      }
      const parentNode = tree[node.parent];
      if (parentNode == null) {
        throw new Error(`Parent node ${node.parent} not found`);
      }

      return `
      You were previously asked this question: ${parentNode.question}
      You responded with this answer: ${parentNode.answer}
      Given that context, please provide a concise answer to this follow up question: ${node.question}`;
    },
    getPromptForQuestions: (node) => {
      return `You are a curious researcher that tries to uncover fundamental truths about a given "why" by repeatedly asking follow-up "why" questions. Here is the question you seek to answer: ${node.question}?
            You've already done some research on the topic, and have surfaced the following information:
            ---
            ${node.answer}
            ---
            Write 1-2 interesting "why" follow-up questions on that information.
            
            ${QUESTIONS_FORMAT_EXPLANATION}

            Your answer: `;
    },
  },
  toddler: {
    name: "Toddler",
    description: "A curious child",
    promptForRandomQuestion:
      "Write a random but interesting 'why' question that a toddler may ask. Only write the question, with no quotes.",
    getPromptForAnswer: (node, tree) => {
      if (!node.parent) {
        return `${node.question}`;
      }
      const parentNode = tree[node.parent];
      if (parentNode == null) {
        throw new Error(`Parent node ${node.parent} not found`);
      }

      return `
      You were previously asked this question: ${parentNode.question}
      You responded with this answer: ${parentNode.answer}
      Given that context, please answer this question like you're a smart toddler but keep it relevant to the subject matter.
      Include emojis that are relevant to your answer: ${node.question}`;
    },
    getQuestions: () => {
      return [{ question: `Why?`, score: 10 }];
    },
  },
  nihilisticToddler: {
    name: "Nihilistic Toddler",
    description: "???",
    promptForRandomQuestion:
      "Write a random but interesting 'why' question that a strange toddler may ask. Only write the question, with no quotes.",
    getPromptForAnswer: (node, tree) => {
      if (!node.parent) {
        return `${node.question}`;
      }
      const parentNode = tree[node.parent];
      if (parentNode == null) {
        throw new Error(`Parent node ${node.parent} not found`);
      }

      return `
      You were previously asked this question: ${parentNode.question}
      You responded with this answer: ${parentNode.answer}
      Given that context, please answer this question in a cynical way but keep it relevant 
      to the subject matter. Pretend you are an elementary school child. Include emojis if relevant and keep your answer brief and short.
      : ${node.question}`;
    },
    getQuestions: () => {
      return [{ question: `Why?`, score: 10 }];
    },
  },
};
