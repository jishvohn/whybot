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
  getPromptForAnswer(node: QATreeNode, tree: QATree): string;
} & (WithGetPromptForQuestions | WithGetQuestions);

export const PERSONAS: { [key: string]: Persona } = {
  researcher: {
    name: "Researcher",
    description:
      "A researcher who is trying to understand the history of the world.",
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
      Given that context, please provide an answer to this follow up question: ${node.question}`;
    },
    getPromptForQuestions: (node, tree) => {
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
  auto: {
    name: "Auto",
    description: "Adapts based on your questions",
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
      Given that context, please provide an answer to this follow up question: ${node.question}`;
    },
    getPromptForQuestions: (node, tree) => {
      return `Given a question/answer pair, generate a likely persona who asked 
            that question. And then pretend you are that persona and write the most interesting 1-2 follow-up questions that this persona would enjoy learning about the most.  For each follow-up question, provide the persona summary & a numeric score from 1 to 10 rating how interesting the question may be to your persona. Format your answer as a JSON array like this: [{"question": "...", "score": 1, "persona_summary": "..."}, {"question": "...", "score": 2, "persona_summary": "..."}, ...]
            
            Your number 1 priority is to generate the most interesting questions that help your generated persona the most.
            
            Question: ${node.question}
            Information/Answer to the question: ${node.answer}
            
            For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10, "persona_summary": "Young man thinking about the scientific nature of the universe and our planet"}]
            Your answer: `;
    },
  },
  toddler: {
    name: "Toddler",
    description: "A curious child",
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
      Given that context, please provide a casual answer to this follow up question, like you're chatting. 
      Include emojis that are relevant to your answer: ${node.question}`;
    },
    getQuestions: (node, tree) => {
      return [{ question: `Why?`, score: 10 }];
    },
  },
  nihilisticToddler: {
    name: "Nihilistic Toddler",
    description: "A broken child",
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
      Given that context, please answer this question in a nihilistic, pessimistic way but keep it relevant 
      to the subject matter. Act as if you're chatting. Include emojis if they are relevant 
      to your answer: ${node.question}`;
    },
    getQuestions: (node, tree) => {
      return [{ question: `Why?`, score: 10 }];
    },
  },
};
