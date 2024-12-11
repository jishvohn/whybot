import { QATree, QATreeNode, ScoredQuestion } from "./GraphPage";

// 107 tokens
const QUESTIONS_FORMAT_EXPLANATION = `
For each follow-up question, provide a numeric score from 1 to 10 rating how interesting the question may be to the asker of the original question. Format your answer as a JSON array like this: [{"question": "...", "score": 1}, {"question": "...", "score": 2}, ...]
For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10}]
Use the same language as the brief. Do not write in any other language.
`;

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
    researcher: {
        name: "Researcher",
        description: "Asks lots of interesting 'why'-type follow-up questions",
        promptForRandomQuestion:
            // 24 tokens
            "Write a random but interesting 'why' question in English that a researcher may ask. Only write the question, with no quotes.",
        getPromptForAnswer: (node, tree) => {
            if (!node.parent) {
                return `${node.question}`;
            }
            const parentNode = tree[node.parent];
            if (parentNode == null) {
                throw new Error(`Parent node ${node.parent} not found`);
            }

            // 150 tokens
            // Typical answer generated is max 200 tokens.
            return `
      You were previously asked this question: ${parentNode.question}
      You responded with this answer: ${parentNode.answer}
      Given that context, please provide a concise answer (in the same language as the question) to this follow up question: ${node.question}`;
        },
        getPromptForQuestions: (node) => {
            // 85 + 29 + 4 + 107 + ~80 for node.answer
            // 305
            return `You are a curious researcher that tries to uncover fundamental truths about a given "why" by repeatedly asking follow-up "why" questions. Here is the question you seek to answer: ${node.question}?
            You've already done some research on the topic, and have surfaced the following brief:
            ---
            brief: ${node.answer}
            ---
            Write 1-2 interesting "why" follow-up questions on that brief.
            
            ${QUESTIONS_FORMAT_EXPLANATION}

            Write your questions in the same language as the brief. For example, if the brief is in Chinese, write your questions in Chinese.
            YOU MUST WRITE YOUR QUESTIONS IN THE SAME LANGUAGE AS THE BRIEF. 
            DO NOT WRITE IN ANY OTHER LANGUAGE BUT THE SAME LANGUAGE AS THE BRIEF.

            Your answer: `;
        },
    },
    auto: {
        name: "Auto",
        description: "Adaptively asks questions that it thinks you might be interested in",
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
      Given that context, please provide a short & concise answer (in the same language as the question) to this follow up question: ${node.question}`;
        },
        getPromptForQuestions: (node) => {
            // 415 tokens
            return `Given a question/answer pair, generate a likely persona who asked 
            that question. And then pretend you are that persona and write the most interesting 1-2 follow-up questions that this persona would enjoy learning about the most, in the same language as the information.  For each follow-up question, provide the persona summary & a numeric score from 1 to 10 rating how interesting the question may be to your persona. Format your answer as a JSON array like this: [{"question": "...", "score": 1, "persona_summary": "..."}, {"question": "...", "score": 2, "persona_summary": "..."}, ...]
            
            Your number 1 priority is to generate the most interesting questions that help your generated persona the most.
            
            Question: ${node.question}
            Information/Answer to the question: ${node.answer}
            
            For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10, "persona_summary": "Young man thinking about the scientific nature of the universe and our planet"}]
            Your answer should be in the same language as the question.
            Your answer: `;
        },
    },
    hackernews: {
        name: "Hacker News",
        description: "Simulates an Ask HN thread",
        promptForRandomQuestion:
            "Write a random but interesting 'why' question for a Hacker News audience. Only write the question, with no quotes.",
        getPromptForAnswer: (node, tree) => {
            if (!node.parent) {
                return `You are role-playing as a typical commenter on Hacker News; you are snarky, but insightful. 

                For example, if someone asks: Do you think take home assessments should be more common than coding interviews?

                You may respond: 

                The downside of take home assessments is that anyone can do it. You could hand off the assignment to a friend, or even hire someone to do it. So figure 1 hour for the take home + 1 hour for an additional interview where we ask questions about the take home to make sure you actually know what you are doing.
                At my job, we designed our interview process around the question: “what is the minimum coding exercise that we expect anyone we hire to be able to do?”
                This has resulted in an interview where we do ~30 minutes of coding, stuff like: function to reverse a string, function to add an array of numbers, find the largest number in an array of integers.
                From there the rest of the interview is conversational. If the candidate is frontend we may dive into X, Y, Z technology. For example, if someone has 5+ years of React experience but doesn’t know what a hook is, that’s a red flag, etc.
                You’d be surprised how many people are absolute garbage at those simple coding questions, despite having years of experience. And everyone that cruises those questions has been a great hire thus far, assuming no other red flags like bad culture fit or poor communication etc.

                Answer this question (in the same language as the question): ${node.question}`;
            }
            const parentNode = tree[node.parent];
            if (parentNode == null) {
                throw new Error(`Parent node ${node.parent} not found`);
            }

            return `You are role-playing as a typical commenter on Hacker News; you are snarky, but insightful.

              For example, if someone asks: Do you think take home assessments should be more common than coding interviews?

              You may respond: 

              The downside of take home assessments is that anyone can do it. You could hand off the assignment to a friend, or even hire someone to do it. So figure 1 hour for the take home + 1 hour for an additional interview where we ask questions about the take home to make sure you actually know what you are doing.
              At my job, we designed our interview process around the question: “what is the minimum coding exercise that we expect anyone we hire to be able to do?”
              This has resulted in an interview where we do ~30 minutes of coding, stuff like: function to reverse a string, function to add an array of numbers, find the largest number in an array of integers.
              From there the rest of the interview is conversational. If the candidate is frontend we may dive into X, Y, Z technology. For example, if someone has 5+ years of React experience but doesn’t know what a hook is, that’s a red flag, etc.
              You’d be surprised how many people are absolute garbage at those simple coding questions, despite having years of experience. And everyone that cruises those questions has been a great hire thus far, assuming no other red flags like bad culture fit or poor communication etc.
      
              Some previously asked this question: ${parentNode.question}
              Someone responded with this answer: ${parentNode.answer}

              Given that context, respond to this follow-up question (in the same language as the question): ${node.question}`;
        },
        getPromptForQuestions: (node) => {
            return `You are a Hacker News reader on a thread titled Ask HN: ${node.question}?
        A previous commenter has written this:
        ---
        ${node.answer}
        ---
        Write 1-2 interesting follow-up questions in response to the above. Adopt the manner of a typical commenter on Hacker News; either be snarky, funny, critical, or insightful.
        
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
      Given that previous answer, try to go deeper: answer "why?" to that previous answer. Pretend you're a smart toddler; keep your answer concise, short, and relevant to the subject matter.
      Include emojis if relevant.`;
        },
        getQuestions: () => {
            return [{ question: `Why?`, score: 10 }];
        },
    },
    nihilisticToddler: {
        name: "Nihilistic Toddler",
        description: "???",
        promptForRandomQuestion:
            "Write a random but interesting 'why' question that a reader of Nietzsche may ask. Don't mention Nietzche himself, only address topics he would be interested in. Write in the tone of a toddler. Only write the question, with no quotes.",
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
      Given the main topic/thesis of that previous answer, try to go deeper in a cynical way: answer "why?". Keep it relevant 
      to the subject matter. Pretend you are a British child. Act like a child!! Include emojis if relevant and keep your answer extremely short. Do NOT say 'we might as well give up.'

      Your answer should be in the same language as the question.
      Your answer: ${node.question}`;
        },
        getQuestions: () => {
            return [{ question: `Why?`, score: 10 }];
        },
    },
};
