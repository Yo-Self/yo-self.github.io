/**
 * @typedef {Object} Dish
 * @property {string} name
 * @property {string} description
 * @property {string} price
 * @property {string} image
 * @property {string[]=} tags
 * @property {string} ingredients
 * @property {string} allergens
 * @property {string} portion
 * @property {string} category
 */
/**
 * @typedef {Dish} MenuItem
 */
/**
 * @typedef {Object} Restaurant
 * @property {string} id
 * @property {string} name
 * @property {string} welcome_message
 * @property {string} image
 * @property {string[]} menu_categories
 * @property {Dish[]} featured_dishes
 * @property {MenuItem[]} menu_items
 */
const fs = require('fs');

// Função para converter preço de centavos para formato brasileiro
/**
 * @param {number} priceInCents
 * @returns {string}
 */
function formatPrice(priceInCents) {
  const priceInReais = priceInCents / 100;
  return priceInReais.toFixed(2).replace('.', ',');
}

// Função para extrair alérgenos dos highLightFeatures
/**
 * @param {any[]} highLightFeatures
 * @returns {string}
 */
function extractAllergens(highLightFeatures) {
  if (!highLightFeatures || highLightFeatures.length === 0) {
    return "Nenhum";
  }
  
  const allergens = highLightFeatures.map(feature => {
    if (feature.name && feature.name.pt) {
      return feature.name.pt;
    }
    return feature.slug || "Alérgeno";
  });
  
  return allergens.join(", ");
}

// Função para gerar URL da imagem do TagMe
/**
 * @param {string} avatarUrl
 * @returns {string}
 */
function generateTagMeImageUrl(avatarUrl) {
  if (!avatarUrl) {
    return "https://source.unsplash.com/400x300/?food";
  }
  
  // Remove "MenuItem/" do início se existir
  const imageId = avatarUrl.replace('MenuItem/', '');
  
  return `https://static.tagme.com.br/pubimg/thumbs/MenuItem/${imageId}?ims=filters:quality(70):format(webp)`;
}

// Função para determinar a categoria baseada no nome ou descrição
function determineCategory(dishName, description) {
  const name = dishName.toLowerCase();
  const desc = description.toLowerCase();
  
  // Sobremesas
  if (name.includes('sorvete') || name.includes('pudim') || name.includes('mousse') || 
      name.includes('tarte') || name.includes('doce') || desc.includes('sobremesa')) {
    return "Sobremesas";
  }
  
  // Bebidas
  if (name.includes('água') || name.includes('refrigerante') || name.includes('suco') || 
      name.includes('cerveja') || name.includes('vinho') || name.includes('café') ||
      name.includes('chá') || name.includes('drink') || name.includes('cocktail')) {
    return "Bebidas";
  }
  
  // Entradas
  if (name.includes('salada') || name.includes('sopa') || name.includes('entrada') ||
      name.includes('tartare') || name.includes('burrata') || name.includes('carpaccio')) {
    return "Entradas";
  }
  
  // Pratos Principais
  return "Pratos Principais";
}

// Função para extrair ingredientes da descrição
/**
 * @param {string} description
 * @returns {string}
 */
function extractIngredients(description) {
  // Remove informações de acompanhamento e foca nos ingredientes principais
  const cleanDesc = description
    .replace(/servido com.*$/i, '')
    .replace(/servida com.*$/i, '')
    .replace(/acompanha.*$/i, '')
    .trim();
  
  return cleanDesc || "Ingredientes especiais da casa";
}

// Função para determinar a porção
/**
 * @param {string} dishName
 * @param {string} description
 * @returns {string}
 */
function determinePortion(dishName, description) {
  const name = dishName.toLowerCase();
  const desc = description.toLowerCase();
  
  if (name.includes('salada') || desc.includes('salada')) {
    return "Prato individual";
  }
  
  if (name.includes('sopa') || desc.includes('sopa')) {
    return "Tigela média";
  }
  
  if (name.includes('sobremesa') || desc.includes('sobremesa')) {
    return "Porção individual";
  }
  
  return "Serve 1 pessoa";
}

// Função principal para transformar o menu
/**
 * @returns {Restaurant}
 */
function transformMenuMoendo() {
  try {
    // Ler o arquivo JSON
    const rawData = fs.readFileSync('src/components/data/menu-moendo.json', 'utf8');
    // @type{}}
    const menuData = JSON.parse(rawData);
    
    // Extrair todos os itens do menu e categorias reais
    const allMenuItems = [];
    const categories = [];
    
    // Percorrer todos os menus (categorias principais)
    menuData.forEach(restaurant => {

      if (restaurant.menus && Array.isArray(restaurant.menus)) {
        restaurant.menus.forEach(menu => {
          const categoria = restaurant.name?.pt?.trim() || menu.name?.pt?.trim() || 'Sem categoria';
          if (categoria && !categories.includes(categoria)) {
            categories.push(categoria);
          }
          if (menu.menuItems && Array.isArray(menu.menuItems)) {
            menu.menuItems.forEach(item => {
              if (item.type === 'dish') {
                const menuItem = {
                  category: categoria,
                  name: item.name.pt || item.name.en || item.name,
                  description: item.descript.pt || item.descript.en || item.descript,
                  price: formatPrice(item.price),
                  image: generateTagMeImageUrl(item.avatarUrl),
                  tags: item.featured ? ["Destaque"] : [],
                  ingredients: extractIngredients(item.descript.pt || item.descript.en || item.descript),
                  allergens: extractAllergens(item.highLightFeatures),
                  portion: determinePortion(item.name.pt || item.name.en, item.descript.pt || item.descript.en)
                };
                allMenuItems.push(menuItem);
              }
            });
          }
        });
      }
    });
    
    // Selecionar pratos em destaque (featured: true)
    const featuredDishes = allMenuItems
      .filter(item => item.tags.includes("Destaque"))
      .slice(0, 5) // Limitar a 5 pratos em destaque
      .map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        tags: item.tags,
        ingredients: item.ingredients,
        allergens: item.allergens,
        portion: item.portion,
        category: item.category
      }));
    
    // Se não houver pratos em destaque, selecionar os primeiros 5
    if (featuredDishes.length === 0) {
      featuredDishes.push(...allMenuItems.slice(0, 5).map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        tags: item.tags,
        ingredients: item.ingredients,
        allergens: item.allergens,
        portion: item.portion,
        category: item.category
      })));
    }
    
    // Criar o objeto do restaurante
    const moendoRestaurant = {
      id: "moendo",
      name: "Moendo",
      welcome_message: "Bem-vindo ao Moendo - Experiência gastronômica única com pratos sofisticados e sabores inovadores",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      menu_categories: categories,
      featured_dishes: featuredDishes,
      menu_items: allMenuItems
    };
    
    // Salvar o resultado
    fs.writeFileSync(__dirname + '/moendo.json', JSON.stringify(moendoRestaurant, null, 2), 'utf8');
    
    console.log('✅ Transformação concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de itens: ${allMenuItems.length}`);
    console.log(`   - Pratos em destaque: ${featuredDishes.length}`);
    console.log(`   - Categorias: ${categories.join(', ')}`);
    console.log(`📁 Arquivo salvo como: moendo.json`);
    
    return moendoRestaurant;
    
  } catch (error) {
    console.error('❌ Erro durante a transformação:', error.message);
    throw error;
  }
}

// Executar a transformação
if (require.main === module) {
  transformMenuMoendo();
}

module.exports = { transformMenuMoendo }; 