import { GoogleGenAI } from "@google/genai";
import { EntityCategory, ProcessingResult, ProcessedNameEntry, GroundingSource } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Process in batches to avoid output token limits
const BATCH_SIZE = 40;

export const verifyNames = async (
  names: string[],
  category: EntityCategory,
  onUpdate?: (data: ProcessingResult, progress: { current: number; total: number }) => void
): Promise<ProcessingResult> => {
  const ai = getClient();
  
  // 1. Sort names alphabetically to maximize chances of variations appearing in same batch
  const sortedNames = [...names].sort();
  
  // 2. Create batches
  const batches: string[][] = [];
  for (let i = 0; i < sortedNames.length; i += BATCH_SIZE) {
    batches.push(sortedNames.slice(i, i + BATCH_SIZE));
  }

  // State to hold cumulative results
  const mergedEntriesMap = new Map<string, ProcessedNameEntry>();
  const uniqueSourcesMap = new Map<string, GroundingSource>();

  // Helper to emit updates
  const emitUpdate = (completedBatches: number) => {
    if (onUpdate) {
      onUpdate({
        entries: Array.from(mergedEntriesMap.values()),
        groundingSources: Array.from(uniqueSourcesMap.values())
      }, {
        current: completedBatches,
        total: batches.length
      });
    }
  };

  for (let i = 0; i < batches.length; i++) {
    const batchNames = batches[i];
    
    // Create a structured prompt
    const prompt = `
      I have a list of raw names extracted from a file. 
      The user is looking for entities in the category: "${category}".
      
      Here is the list of raw names for this batch:
      ${JSON.stringify(batchNames)}

      Your task:
      1. Identify the correct, canonical real-world name for each entity found in the list.
      2. Group all misspellings, partial matches, or duplicate variations from the input list under that correct entity.
      3. Use Google Search to verify the spelling and existence of these people.
      4. Provide a short description (e.g., "CNN Anchor", "Investigative Journalist").
      5. If a name in the list does not look like a person's name or is completely unrecognizable/irrelevant, mark it as unverified.
      
      Output Format:
      Return a JSON array wrapped in a markdown code block (\`\`\`json ... \`\`\`).
      Each object in the array must follow this schema:
      {
        "correctName": "The verified full name",
        "originalVariations": ["List", "of", "raw", "names", "that", "match", "this", "person"],
        "description": "Short role/job description",
        "isVerified": boolean (true if found via search)
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      let newEntries: any[] = [];
      
      // Robust JSON Extraction
      // 1. Try to find markdown code block
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          newEntries = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn(`Failed to parse JSON from markdown block in batch ${i + 1}`);
        }
      } 
      
      // 2. If Markdown failed, try to find the array brackets directly
      if (newEntries.length === 0) {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
          try {
            const rawJson = text.substring(start, end + 1);
            newEntries = JSON.parse(rawJson);
          } catch (e) {
             console.error(`Failed to parse raw JSON from batch ${i + 1}`, e);
          }
        } else {
             console.warn(`No JSON structure found in batch ${i + 1}`);
        }
      }

      // Process and merge new entries immediately
      if (Array.isArray(newEntries)) {
        newEntries.forEach((item, index) => {
          // Normalize key
          const key = item.correctName ? item.correctName.trim().toUpperCase() : `UNKNOWN-${Date.now()}-${index}`;
          
          if (!item.correctName) return; 

          const entry: ProcessedNameEntry = {
              id: `entry-${i}-${index}-${Date.now()}`,
              correctName: item.correctName,
              originalVariations: Array.isArray(item.originalVariations) ? item.originalVariations : [],
              description: item.description || '',
              isVerified: !!item.isVerified
          };

          const existing = mergedEntriesMap.get(key);
          if (existing) {
            // Merge
            existing.originalVariations = Array.from(new Set([
              ...existing.originalVariations,
              ...entry.originalVariations
            ]));
            // Update metadata if the new entry is verified and existing wasn't
            if (!existing.isVerified && entry.isVerified) {
                existing.isVerified = true;
            }
            if ((!existing.description || existing.description === 'Unverified') && entry.description) {
              existing.description = entry.description;
            }
          } else {
            mergedEntriesMap.set(key, entry);
          }
        });
      }

      // Extract Grounding Metadata safely
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          const uri = chunk.web.uri;
          if (uri && !uniqueSourcesMap.has(uri)) {
             uniqueSourcesMap.set(uri, {
                title: chunk.web.title || 'Source',
                uri: uri
             });
          }
        }
      });

      // Emit progress after every batch
      emitUpdate(i + 1);

    } catch (error) {
      console.error(`Gemini API Error in batch ${i + 1}:`, error);
      // Still emit update to move progress bar
      emitUpdate(i + 1);
    }
  }

  return {
    entries: Array.from(mergedEntriesMap.values()),
    groundingSources: Array.from(uniqueSourcesMap.values())
  };
};