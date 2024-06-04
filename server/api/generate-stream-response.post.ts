import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod"

const inputSchema = z.object({
  question: z.string().describe("The question to be answered")
})

export type Input = z.infer<typeof inputSchema>;

const outputSchema = z.object({ 
  answer: z.string(), 
  sources: z.array(z.string()).describe('List of sources, must be websites'), 
  confidence_level: z.number().min(0).max(1) 
})

export type Output = z.infer<typeof outputSchema>;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody(event)

  const { question } = inputSchema.parse(JSON.parse(body))

  /**
   * TODO: tweak the prompt
   * TODO: use `ChatPromptTemplate.fromMessages` method
   * TODO: use `dedent` for multi-lining the prompt
   */
  const prompt = ChatPromptTemplate.fromTemplate("Répondez à la question avec une simplicité exceptionnelle comme si j'avais 12 ans.\n\nQuestion: {question}");

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

  const parser = StructuredOutputParser.fromZodSchema(outputSchema)

  const chain = prompt.pipe(llm).pipe(new JsonOutputFunctionsParser({ diff: true }));

  const stream = await chain.stream({ question });

  const encodedStream = stream.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      console.log({ chunk })
      controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk)));
    }
  }));

  return sendStream(event, encodedStream);
});
