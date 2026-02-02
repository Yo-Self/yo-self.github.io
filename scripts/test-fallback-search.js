
// Mock data mimicking the restaurant structure
const mockRestaurantData = {
    name: "Restaurante Teste",
    description: "Um restaurante de teste",
    slug: "teste",
    menu_items: [
        {
            name: "Hamburguer Clássico",
            description: "Pão, carne, queijo e alface",
            price: "30,00",
            ingredients: "pão brioche, carne bovina 180g, queijo cheddar, alface americana",
        },
        {
            name: "Macarrão Carbonara",
            description: "Massa com molho branco e bacon",
            price: "45,00",
            ingredients: "spaghetti, ovos, queijo parmesão, bacon, pimenta do reino",
        },
        {
            name: "Salada Caesar",
            description: "Salada leve com frango",
            price: "25,00",
            ingredients: "alface romana, croutons, molho caesar, frango grelhado",
        }
    ]
};

// The IMPROVED fallback function copied from our implementation
function searchFallback(message, restaurantData) {
    if (!restaurantData || !restaurantData.menu_items) {
        return "Desculpe, não consigo acessar o cardápio no momento.";
    }

    const query = message.toLowerCase();
    // Remove pontuação e caracteres especiais, mantendo apenas letras, números e espaços
    const cleanQuery = query.replace(/[^\w\s\u00C0-\u00FF]/g, ' ');
    const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 3); // Ignora palavras curtas

    if (keywords.length === 0) {
        return "Poderia repetir com mais detalhes o que você procura?";
    }

    const matches = restaurantData.menu_items.filter((item) => {
        const textToSearch = `${item.name} ${item.description} ${item.ingredients || ''}`.toLowerCase();
        // Verifica se alguma palavra-chave está presente
        return keywords.some(keyword => textToSearch.includes(keyword));
    });

    if (matches.length > 0) {
        // Limitar a 3 sugestões
        const suggestions = matches.slice(0, 3).map((item) =>
            `*${item.name}* - ${item.description} (R$ ${item.price})`
        ).join('\n\n');

        return `A IA está temporariamente indisponível, mas encontrei estes pratos relacionados ao que você pediu:\n\n${suggestions}\n\nPosso ajudar com algo mais específico?`;
    }

    return "A IA está indisponível no momento e não encontrei pratos exatos com esses termos. Tente buscar por ingredientes como 'camarão', 'carne' ou 'doce'.";
}

// Test cases
const testCases = [
    { message: "quero comer carne.", expectedKeyword: "carne" }, // Punctuation check
    { message: "tem algo com bacon?", expectedKeyword: "bacon" }, // Punctuation check
    { message: "gostaria de uma salada!", expectedKeyword: "salada" }, // Punctuation check
    { message: "tem sushi?", expectedKeyword: "sushi" } // Should fail
];

console.log("=== Testing Improved Fallback Search Logic ===\n");

testCases.forEach(test => {
    console.log(`Query: "${test.message}"`);
    const result = searchFallback(test.message, mockRestaurantData);
    console.log("Result HEAD:");
    console.log(result.split('\n')[0]); // Only show the first line to be concise
    const success = result.includes("encontrei estes pratos") || result.includes("não encontrei pratos");
    console.log("Found match/no-match pattern:", success);

    if (test.expectedKeyword !== 'sushi') {
        const hasDish = result.includes("*");
        console.log("Found dish:", hasDish ? "YES" : "NO (FAILED)");
    } else {
        const noDish = !result.includes("*");
        console.log("Correctly found no dish:", noDish ? "YES" : "NO (FAILED)");
    }
    console.log("-----------------------------------");
});
