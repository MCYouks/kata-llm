import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import dedent from "dedent";

import { z } from "zod"

const bodySchema = z.object({
  question: z.string().describe("The question to be answered")
})

export type Body = z.infer<typeof bodySchema>;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody(event)

  const { question } = bodySchema.parse(JSON.parse(body))

  /**
   * TODO: implement `temperature` and `modelName`
   */
  const llm = new OpenAI({
    openAIApiKey: config.OPENAI_KEY,
    temperature: 0.8,
    modelName: "gpt-4-turbo"
    
  });

  const prompt = PromptTemplate.fromTemplate(
    dedent`Répondez à la question avec une simplicité exceptionnelle comme si j'avais 12 ans.

    Question: {question}
  `
  );

  console.log("Bonjour les papillons")

  const chain = prompt.pipe(llm);

  console.log("Hola hola")

  const stream = (await chain.stream({ question }));

  return sendStream(event, stream);
});
