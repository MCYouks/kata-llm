import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { z } from "zod"

const bodySchema = z.object({
  question: z.string().describe("The question to be answered")
})

export type Body = z.infer<typeof bodySchema>;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody(event)

  const { question } = bodySchema.parse(body)

  /**
   * TODO: implement `temperature` and `modelName`
   */
  const llm = new ChatOpenAI({
    openAIApiKey: config.OPENAI_KEY,
    temperature: 0.8,
    modelName: "gpt-4-turbo"
    
  });

  /**
   * TODO: tweak the prompt
   * TODO: use `ChatPromptTemplate.fromMessages` method
   * TODO: use `dedent` for multi-lining the prompt
   */
  const prompt = ChatPromptTemplate.fromTemplate("Répondez à la question avec une simplicité exceptionnelle comme si j'avais 12 ans. \n\nQuestion: {question}");

  /**
   * TODO: Change String parser to a Structured output parser — https://js.langchain.com/v0.1/docs/modules/model_io/output_parsers/types/structured/
   */
  const parser = new StringOutputParser()

  const chain = prompt.pipe(llm).pipe(parser);

  const response = await chain.invoke({ question });

  return response
});
