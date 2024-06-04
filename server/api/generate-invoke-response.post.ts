import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  StringOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";

import { z } from "zod";

const bodySchema = z.object({
  ingredients: z.string().describe("The ingredients to be listed"),
});

export type Body = z.infer<typeof bodySchema>;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody(event);

  const { ingredients } = bodySchema.parse(body);

  /**
   * TODO: implement `temperature` and `modelName`
   */
  const llm = new ChatOpenAI({
    openAIApiKey: config.OPENAI_KEY,
    temperature: 0.8,
    modelName: "gpt-4-turbo",
  });

  /**
   * TODO: use `ChatPromptTemplate.fromMessages` method
   * TODO: use `dedent` for multi-lining the prompt
   */
  const prompt = ChatPromptTemplate.fromTemplate(
    "Je vais te donner une liste d'ingrédients. Propose moi 1 recettes à partir de ces ingrédients PRINCIPALEMENT, mais aussi avec d'autres si besoin, que tu me listeras à la fin de la recette (type liste de course).\n\nFormat instructions:{format_instructions}\n\nIngrédients: {ingredients}"
  );

  /**
   * TODO: Change String parser to a Structured output parser — https://js.langchain.com/v0.1/docs/modules/model_io/output_parsers/types/structured/
   */
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
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
  );

  console.log(parser.getFormatInstructions());


  const chain = prompt.pipe(llm).pipe(parser);

  const response = await chain.invoke({
    ingredients,
    format_instructions: parser.getFormatInstructions(),
  });

  return response;
});
