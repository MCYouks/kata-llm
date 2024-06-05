import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod"


export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody(event)

  const inputSchema = z.object({
    ingredients: z.string().describe("The list of ingredients in the fridge")
  })
  
  const { ingredients } = inputSchema.parse(JSON.parse(body))

  /**
   * TODO: use `ChatPromptTemplate.fromMessages` method
   * TODO: use `dedent` for multi-lining the prompt
   */
  const prompt = ChatPromptTemplate.fromTemplate("Je vais te donner une liste d'ingrédients. Propose moi 3 recettes à partir de ces ingrédients PRINCIPALEMENT, mais aussi avec d'autres si besoin, que tu me listeras à la fin de la recette (type liste de course). \n\nIngrédients: {ingredients}");

  const outputSchema = z.object({
    recipes: z.array(
      z.object({
        name: z.string(),
        ingredients: z.array(
          z.object({
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
          })
        ),
        ingredients_missing_in_the_fridge: z.array(
          z.object({
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
          })
        ),
        steps: z.array(z.string()),
      })
    ),
  })

  const modelParams = {
    functions: [
      {
        name: "extractor",
        description: "Extracts fields from the input.",
        parameters: zodToJsonSchema(outputSchema),
      },
    ],
    function_call: { name: "extractor" },
  };

  /**
   * TODO: implement `temperature` and `modelName`
   */
  const llm = new ChatOpenAI({
    openAIApiKey: config.OPENAI_KEY,
    temperature: 0.8,
    modelName: "gpt-4-turbo"
  }).bind(modelParams);

  /**
   * TODO: Change String parser to a Structured output parser — https://js.langchain.com/v0.1/docs/modules/model_io/output_parsers/types/structured/
   */

  const chain = prompt.pipe(llm).pipe(new JsonOutputFunctionsParser({ diff: true }));

  const stream = await chain.stream({ ingredients });

  const encodedStream = stream.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk)));
    }
  }));

  return sendStream(event, encodedStream);
});
