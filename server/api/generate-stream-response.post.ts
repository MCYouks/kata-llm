import {  ChatPromptTemplate } from "@langchain/core/prompts";
import { OpenAI, ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";



import { z } from "zod"

const bodySchema = z.object({
  ingredients: z.string().describe("The ingredients to be listed")
})

export type Body = z.infer<typeof bodySchema>;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody(event)

  const { ingredients } = bodySchema.parse(JSON.parse(body))

  /**
   * TODO: implement `temperature` and `modelName`
   */
  const llm = new OpenAI({
    openAIApiKey: config.OPENAI_KEY,
    temperature: 0.8,
    modelName: "gpt-4-turbo"
    
  });

  /**
   * TODO: use `ChatPromptTemplate.fromMessages` method
   * TODO: use `dedent` for multi-lining the prompt
   */
  const prompt = ChatPromptTemplate.fromTemplate("Je vais te donner une liste d'ingrédients. Propose moi 3 recettes à partir de ces ingrédients PRINCIPALEMENT, mais aussi avec d'autres si besoin, que tu me listeras à la fin de la recette (type liste de course). \n\nIngrédients: {ingredients}");

  /**
   * TODO: Change String parser to a Structured output parser — https://js.langchain.com/v0.1/docs/modules/model_io/output_parsers/types/structured/
   */
  const parser = new StringOutputParser()

  const chain = prompt.pipe(llm).pipe(parser);

  const stream = await chain.stream({ ingredients });

  return sendStream(event, stream);
});
