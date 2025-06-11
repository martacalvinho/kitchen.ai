import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {
    "HTTP-Referer": "https://kitchen-ai.app",
    "X-Title": "Kitchen.AI",
  },
  dangerouslyAllowBrowser: true
});

export interface MealPlanRequest {
  planType: string;
  mealsPerDay: number;
  peopleCount: number;
  skillLevel?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  preferences?: string[];
}

export interface GeneratedMeal {
  name: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
}

export const generateSingleMeal = async (request: MealPlanRequest): Promise<GeneratedMeal> => {
  try {
    const skillConstraint = request.skillLevel ? 
      `- Skill level: ${request.skillLevel} (Easy: 15-30min simple recipes, Medium: 30-60min moderate complexity, Hard: 60+ min advanced techniques)` : '';
    
    const prompt = `Generate ONE meal that matches these requirements:
    - Plan type: ${request.planType} (CRITICAL: The meal MUST match this theme/type exactly)
    - For ${request.peopleCount} people
    ${skillConstraint}
    ${request.dietaryRestrictions?.length ? `- Dietary restrictions: ${request.dietaryRestrictions.join(', ')}` : ''}
    ${request.allergies?.length ? `- Allergies to avoid: ${request.allergies.join(', ')}` : ''}
    ${request.preferences?.length ? `- Preferences: ${request.preferences.join(', ')}` : ''}
    
    CRITICAL REQUIREMENTS:
    1. If plan type is "pasta dishes", the meal MUST be a pasta-based dish
    2. If plan type is "healthy meals", focus on nutritious, balanced options
    3. If plan type is "quick meals", meal should be under 30 minutes
    4. Match the theme exactly - no exceptions
    5. Respect the skill level constraints for cooking time and complexity
    6. Ensure proper serving sizes for ${request.peopleCount} people
    7. Include detailed ingredients with quantities
    8. Provide step-by-step cooking instructions
    
    Return in JSON format:
    {
      "name": "Specific meal name that matches the ${request.planType} theme",
      "description": "Brief appetizing description",
      "cookTime": 30,
      "servings": ${request.peopleCount},
      "difficulty": "Easy|Medium|Hard",
      "ingredients": ["ingredient 1 (specific quantity for ${request.peopleCount} people)", "ingredient 2 (quantity)", "ingredient 3 (quantity)"],
      "instructions": ["detailed step 1", "detailed step 2", "detailed step 3", "detailed step 4"]
    }
    
    Make sure the meal perfectly matches "${request.planType}" theme.`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
      messages: [
        {
          "role": "user",
          "content": prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from AI');
    
    // Clean the response to extract valid JSON
    let cleanedResponse = response.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the JSON object
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
    
    // Fix common JSON issues
    const fixedJson = jsonString
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/\n/g, ' ')     // Remove newlines
      .replace(/\s+/g, ' ');   // Normalize whitespace
    
    const parsed = JSON.parse(fixedJson);
    return parsed;
  } catch (error) {
    console.error('AI single meal generation failed:', error);
    // Fallback to mock data that respects the plan type and skill level
    return generateMockSingleMeal(request);
  }
};

export const generateMealPlan = async (request: MealPlanRequest): Promise<GeneratedMeal[]> => {
  try {
    const skillConstraint = request.skillLevel ? 
      `- Skill level: ${request.skillLevel} (Easy: 15-30min simple recipes, Medium: 30-60min moderate complexity, Hard: 60+ min advanced techniques)` : '';
    
    const prompt = `Generate a weekly meal plan with the following requirements:
    - Plan type: ${request.planType} (IMPORTANT: ALL meals must match this theme/type exactly)
    - ${request.mealsPerDay} meals per day for 7 days (total: ${request.mealsPerDay * 7} meals)
    - For ${request.peopleCount} people
    ${skillConstraint}
    ${request.dietaryRestrictions?.length ? `- Dietary restrictions: ${request.dietaryRestrictions.join(', ')}` : ''}
    ${request.allergies?.length ? `- Allergies to avoid: ${request.allergies.join(', ')}` : ''}
    ${request.preferences?.length ? `- Preferences: ${request.preferences.join(', ')}` : ''}
    
    CRITICAL REQUIREMENTS:
    1. If plan type is "pasta dishes", ALL meals must be pasta-based dishes
    2. If plan type is "healthy meals", focus on nutritious, balanced options
    3. If plan type is "quick meals", all meals should be under 30 minutes
    4. Match the theme exactly - no exceptions
    5. Respect the skill level constraints for cooking time and complexity
    6. Ensure proper serving sizes for ${request.peopleCount} people
    
    Return exactly ${request.mealsPerDay * 7} different meals in JSON format:
    {
      "meals": [
        {
          "name": "Specific meal name that matches the ${request.planType} theme",
          "description": "Brief description",
          "cookTime": 30,
          "servings": ${request.peopleCount},
          "difficulty": "Easy|Medium|Hard",
          "ingredients": ["ingredient 1 (quantity)", "ingredient 2 (quantity)", "ingredient 3 (quantity)"],
          "instructions": ["step 1", "step 2", "step 3"]
        }
      ]
    }
    
    Ensure variety - no repeated meals and all must match "${request.planType}" theme perfectly.`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
      messages: [
        {
          "role": "user",
          "content": prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from AI');
    
    // Clean the response to extract valid JSON
    let cleanedResponse = response.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the JSON object
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
    
    // Fix common JSON issues
    const fixedJson = jsonString
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/\n/g, ' ')     // Remove newlines
      .replace(/\s+/g, ' ');   // Normalize whitespace
    
    const parsed = JSON.parse(fixedJson);
    return parsed.meals || [];
  } catch (error) {
    console.error('AI meal generation failed:', error);
    // Fallback to mock data that respects the plan type and skill level
    return generateMockMeals(request);
  }
};

export const generateShoppingList = async (meals: GeneratedMeal[]): Promise<string[]> => {
  try {
    // Extract all ingredients from all meals
    const allIngredients = meals.flatMap(meal => meal.ingredients);
    const ingredientText = allIngredients.join(', ');
    
    const prompt = `Given these ingredients from ${meals.length} meals in a weekly meal plan: ${ingredientText}
    
    Create a consolidated shopping list that:
    1. Combines similar ingredients with realistic total quantities needed
    2. Groups by category (produce, meat, dairy, pantry, etc.)
    3. Includes proper amounts for all the meals
    4. Removes duplicates and consolidates quantities
    5. Uses standard shopping quantities (e.g., "2 lbs ground beef" not "ground beef")
    
    Return in JSON format: {"items": ["2 lbs ground beef", "1 box spaghetti (16 oz)", "1 jar marinara sauce (24 oz)"]}
    
    Make sure to include ALL ingredients needed for the ${meals.length} meals with appropriate quantities.`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
      messages: [
        {
          "role": "user",
          "content": prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from AI');
    
    // Clean the response to extract valid JSON
    let cleanedResponse = response.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the JSON object
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
    
    // Fix common JSON issues
    const fixedJson = jsonString
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/\n/g, ' ')     // Remove newlines
      .replace(/\s+/g, ' ');   // Normalize whitespace
    
    const parsed = JSON.parse(fixedJson);
    return parsed.items || [];
  } catch (error) {
    console.error('AI shopping list generation failed:', error);
    // Fallback to processing ingredients manually
    return generateShoppingListFallback(meals);
  }
};

const generateShoppingListFallback = (meals: GeneratedMeal[]): string[] => {
  const ingredientCounts: Record<string, number> = {};
  
  // Count ingredient occurrences
  meals.forEach(meal => {
    meal.ingredients.forEach(ingredient => {
      // Clean ingredient name (remove quantities in parentheses)
      const cleanIngredient = ingredient.replace(/\s*\([^)]*\)/g, '').trim();
      ingredientCounts[cleanIngredient] = (ingredientCounts[cleanIngredient] || 0) + 1;
    });
  });
  
  // Convert to shopping list with estimated quantities
  return Object.entries(ingredientCounts).map(([ingredient, count]) => {
    if (count === 1) return ingredient;
    if (count <= 3) return `${count}x ${ingredient}`;
    return `${Math.ceil(count / 2)} lbs ${ingredient}`;
  });
};

const generateMockSingleMeal = (request: MealPlanRequest): GeneratedMeal => {
  const mockMeals = generateMockMeals(request);
  return mockMeals[Math.floor(Math.random() * mockMeals.length)];
};

const generateMockMeals = (request: MealPlanRequest): GeneratedMeal[] => {
  // Create theme-specific mock meals that respect skill level
  const getMockMealsByTheme = (theme: string, skillLevel?: string) => {
    const getTimeForSkill = (skill?: string) => {
      switch (skill) {
        case 'Easy': return { min: 15, max: 30 };
        case 'Medium': return { min: 30, max: 60 };
        case 'Hard': return { min: 60, max: 90 };
        default: return { min: 20, max: 45 };
      }
    };
    
    const timeRange = getTimeForSkill(skillLevel);
    
    const themes: Record<string, GeneratedMeal[]> = {
      'pasta dishes': [
        {
          name: "Spaghetti Carbonara",
          description: "Classic Italian pasta with eggs, cheese, and pancetta",
          cookTime: Math.max(timeRange.min, 20),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Medium",
          ingredients: ["1 lb spaghetti", "4 large eggs", "1 cup parmesan cheese", "8 oz pancetta", "black pepper"],
          instructions: ["Cook pasta", "Fry pancetta", "Mix eggs and cheese", "Combine with hot pasta"]
        },
        {
          name: "Penne Arrabbiata",
          description: "Spicy tomato pasta with garlic and red peppers",
          cookTime: Math.max(timeRange.min, 25),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Easy",
          ingredients: ["1 lb penne pasta", "2 cans diced tomatoes", "4 cloves garlic", "red pepper flakes", "olive oil"],
          instructions: ["Cook pasta", "Sauté garlic", "Add tomatoes and spices", "Toss with pasta"]
        },
        {
          name: "Fettuccine Alfredo",
          description: "Creamy pasta with butter, cream, and parmesan",
          cookTime: Math.max(timeRange.min, 15),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Easy",
          ingredients: ["1 lb fettuccine", "1/2 cup butter", "1 cup heavy cream", "1 cup parmesan cheese", "nutmeg"],
          instructions: ["Cook pasta", "Melt butter", "Add cream", "Toss with cheese and pasta"]
        },
        {
          name: "Lasagna Bolognese",
          description: "Layered pasta with meat sauce and cheese",
          cookTime: Math.min(timeRange.max, 90),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Hard",
          ingredients: ["1 box lasagna sheets", "2 lbs ground beef", "3 cups tomato sauce", "2 cups mozzarella", "2 cups ricotta"],
          instructions: ["Make meat sauce", "Cook pasta", "Layer ingredients", "Bake until golden"]
        },
        {
          name: "Linguine with Clam Sauce",
          description: "Seafood pasta with white wine and herbs",
          cookTime: Math.max(timeRange.min, 30),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Medium",
          ingredients: ["1 lb linguine", "2 lbs fresh clams", "1/2 cup white wine", "4 cloves garlic", "fresh parsley"],
          instructions: ["Cook pasta", "Steam clams", "Make wine sauce", "Combine and serve"]
        },
        {
          name: "Ravioli with Sage Butter",
          description: "Cheese-filled pasta with brown butter and sage",
          cookTime: Math.max(timeRange.min, 15),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Easy",
          ingredients: ["2 lbs cheese ravioli", "1/2 cup butter", "fresh sage leaves", "parmesan cheese", "pine nuts"],
          instructions: ["Cook ravioli", "Brown butter", "Add sage", "Toss and garnish"]
        },
        {
          name: "Pasta Puttanesca",
          description: "Bold pasta with olives, capers, and anchovies",
          cookTime: Math.max(timeRange.min, 25),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Medium",
          ingredients: ["1 lb spaghetti", "1/2 cup olives", "2 tbsp capers", "4 anchovy fillets", "2 cans tomatoes"],
          instructions: ["Cook pasta", "Sauté aromatics", "Add tomatoes", "Finish with olives and capers"]
        }
      ],
      'healthy meals': [
        {
          name: "Quinoa Buddha Bowl",
          description: "Nutritious bowl with quinoa, vegetables, and tahini dressing",
          cookTime: Math.max(timeRange.min, 25),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Easy",
          ingredients: ["2 cups quinoa", "4 cups kale", "1 can chickpeas", "2 avocados", "tahini"],
          instructions: ["Cook quinoa", "Massage kale", "Roast chickpeas", "Assemble bowl"]
        },
        {
          name: "Grilled Salmon with Vegetables",
          description: "Omega-3 rich salmon with roasted seasonal vegetables",
          cookTime: Math.max(timeRange.min, 30),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Medium",
          ingredients: [`${request.peopleCount} salmon fillets`, "2 cups broccoli", "2 sweet potatoes", "olive oil", "mixed herbs"],
          instructions: ["Season salmon", "Roast vegetables", "Grill fish", "Serve together"]
        },
        {
          name: "Mediterranean Chicken Bowl",
          description: "Lean protein with fresh vegetables and herbs",
          cookTime: Math.max(timeRange.min, 35),
          servings: request.peopleCount,
          difficulty: (skillLevel as any) || "Easy",
          ingredients: [`${request.peopleCount} chicken breasts`, "cucumber", "tomatoes", "feta cheese", "olive oil"],
          instructions: ["Season chicken", "Grill chicken", "Prepare vegetables", "Assemble bowl"]
        }
      ],
      'quick meals': [
        {
          name: "15-Minute Stir Fry",
          description: "Fast and flavorful vegetable stir fry",
          cookTime: 15,
          servings: request.peopleCount,
          difficulty: "Easy",
          ingredients: ["2 cups mixed vegetables", "soy sauce", "2 cloves garlic", "fresh ginger", "2 cups cooked rice"],
          instructions: ["Heat oil", "Stir fry vegetables", "Add sauce", "Serve over rice"]
        },
        {
          name: "Quick Chicken Quesadillas",
          description: "Crispy tortillas with chicken and cheese",
          cookTime: 20,
          servings: request.peopleCount,
          difficulty: "Easy",
          ingredients: ["flour tortillas", "cooked chicken", "cheese", "bell peppers", "onions"],
          instructions: ["Prepare filling", "Assemble quesadillas", "Cook until crispy", "Slice and serve"]
        }
      ]
    };

    return themes[theme.toLowerCase()] || themes['healthy meals'];
  };

  const baseMeals = getMockMealsByTheme(request.planType, request.skillLevel);
  const mealsNeeded = request.mealsPerDay * 7;
  const meals = [];

  // Generate enough meals, cycling through available options
  for (let i = 0; i < mealsNeeded; i++) {
    const baseMeal = baseMeals[i % baseMeals.length];
    meals.push({
      ...baseMeal,
      name: i < baseMeals.length ? baseMeal.name : `${baseMeal.name} (Variation ${Math.floor(i / baseMeals.length) + 1})`,
      servings: request.peopleCount
    });
  }
  
  return meals;
};