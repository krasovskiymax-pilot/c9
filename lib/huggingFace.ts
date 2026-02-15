/**
 * Интеграция с Hugging Face для генерации изображений.
 * Использует @huggingface/inference с провайдером "auto" (router.huggingface.co).
 */
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = (process.env.HUGGINGFACE_API_KEY ?? "").trim();
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";

/**
 * Генерирует изображение по текстовому промпту.
 * @returns Buffer с бинарными данными PNG
 */
export async function generateImage(prompt: string): Promise<Buffer> {
  if (!HF_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY не задан в переменных окружения.");
  }

  const client = new InferenceClient(HF_API_KEY);

  const result = (await client.textToImage(
    {
      model: HF_MODEL,
      inputs: prompt,
      provider: "auto",
      parameters: { num_inference_steps: 5 }
    },
    { outputType: "blob" as const }
  )) as Blob;

  const arrayBuffer = await result.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
