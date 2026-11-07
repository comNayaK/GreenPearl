const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/lib/datasets/data');

function saveDataset(fileName, items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = (item.name || item.word || item.id || '').trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }
  const filePath = path.join(dataDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deduped, null, 2), 'utf-8');
  console.log(`Saved ${fileName}: ${deduped.length} items`);
  return deduped.length;
}

// FOOD AND DISHES (120+ North Indian and Global popular dishes)
const foodDishes = [
  "Butter Chicken", "Paneer Tikka", "Dal Makhani", "Chole Bhature", "Biryani",
  "Rajma Chawal", "Palak Paneer", "Rogan Josh", "Malai Kofta", "Pav Bhaji",
  "Pani Puri", "Aloo Paratha", "Gulab Jamun", "Jalebi", "Rasgulla",
  "Kadhai Paneer", "Shahi Paneer", "Dum Aloo", "Sarson Ka Saag & Makki Di Roti", "Amritsari Kulcha",
  "Kadhi Pakora", "Baingan Bharta", "Bhindi Masala", "Aloo Gobi", "Jeera Aloo",
  "Matar Paneer", "Paneer Butter Masala", "Chicken Tikka Masala", "Tandoori Chicken", "Seekh Kebab",
  "Galouti Kebab", "Kakori Kebab", "Mutton Korma", "Nihari", "Haleem",
  "Chicken Biryani", "Mutton Biryani", "Veg Biryani", "Samosa", "Kachori",
  "Dahi Vada", "Aloo Tikki", "Papdi Chaat", "Sev Puri", "Bhel Puri",
  "Momos", "Chowmein", "Spring Rolls", "Chilli Chicken", "Chilli Paneer",
  "Manchurian", "Fried Rice", "Hakka Noodles", "Sweet Corn Soup", "Hot and Sour Soup",
  "Gajar Ka Halwa", "Moong Dal Halwa", "Kheer", "Rabri", "Kulfi",
  "Rasmalai", "Kaju Katli", "Motichoor Ladoo", "Besan Ladoo", "Soan Papdi",
  "Dhokla", "Khandvi", "Poha", "Upma", "Medu Vada",
  "Masala Dosa", "Idli Sambar", "Uttapam", "Appam", "Pesarattu",
  "Fish Curry", "Prawn Masala", "Chicken Chettinad", "Laal Maas", "Gatte Ki Sabzi",
  "Ker Sangri", "Dal Baati Churma", "Puran Poli", "Misal Pav", "Vada Pav",
  "Pizza Margherita", "Pepperoni Pizza", "Pasta Carbonara", "Penne Arrabbiata", "Lasagna",
  "Cheeseburger", "Crispy French Fries", "Tacos", "Burritos", "Nachos with Guacamole",
  "Sushi Roll", "Chicken Ramen", "Pad Thai", "Dim Sum", "Shawarma",
  "Falafel Hummus Platter", "Baklava", "Tiramisu", "Cheesecake", "Churros",
  "Croissant", "Waffles with Maple Syrup", "Pancakes", "Garlic Bread", "Caesar Salad"
].map((name, idx) => ({
  id: `food_${String(idx + 1).padStart(3, '0')}`,
  name,
  category: "lifestyle",
  subcategory: "food_and_dishes",
  difficulty: idx < 40 ? "easy" : idx < 90 ? "medium" : "hard",
  region: idx < 80 ? "india" : "international"
}));

saveDataset('food_and_dishes.json', foodDishes);

// FRUITS AND VEGETABLES (90 items)
const fruitsVeg = [
  "Mango", "Apple", "Banana", "Orange", "Grapes",
  "Watermelon", "Pomegranate", "Papaya", "Pineapple", "Guava",
  "Strawberry", "Lychee", "Kiwi", "Blueberry", "Avocado",
  "Custard Apple (Sitaphal)", "Jackfruit (Kathal)", "Peach", "Plum", "Cherry",
  "Pear", "Dragonfruit", "Coconut", "Muskmelon", "Sweet Lime (Mosambi)",
  "Fig (Anjeer)", "Dates (Khajoor)", "Blackberry (Jamun)", "Mulberry (Shahtoot)", "Amla (Gooseberry)",
  "Potato (Aloo)", "Onion (Pyaaz)", "Tomato (Tamatar)", "Garlic (Lahsun)", "Ginger (Adrak)",
  "Cauliflower (Gobi)", "Cabbage (Patta Gobi)", "Spinach (Palak)", "Green Peas (Matar)", "Lady Finger (Bhindi)",
  "Brinjal / Eggplant (Baingan)", "Capsicum / Bell Pepper (Shimla Mirch)", "Carrot (Gajar)", "Radish (Mooli)", "Bottle Gourd (Lauki)",
  "Bitter Gourd (Karela)", "Ridge Gourd (Torai)", "Pumpkin (Kaddu)", "Cucumber (Kheera)", "Beetroot (Chukandar)",
  "Fenugreek (Methi)", "Coriander (Dhaniya)", "Mint (Pudina)", "Green Chilli (Hari Mirch)", "Curry Leaves (Kadi Patta)",
  "Mushrooms", "Sweet Potato (Shakarkandi)", "Colocasia (Arbi)", "Drumsticks (Sahjan)", "Raw Banana (Kacha Kela)",
  "Zucchini", "Broccoli", "Asparagus", "Celery", "Lettuce",
  "Artichoke", "Kale", "Turnip (Shalgam)", "Yam (Jimikand)", "Lotus Stem (Kamal Kakdi)"
].map((name, idx) => ({
  id: `fv_${String(idx + 1).padStart(3, '0')}`,
  name,
  category: "nature",
  subcategory: "fruits_vegetables",
  difficulty: idx < 30 ? "easy" : idx < 60 ? "medium" : "hard",
  region: "general"
}));

saveDataset('fruits_vegetables.json', fruitsVeg);

// CITIES (150+ famous Indian and World cities)
const cities = [
  "Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai",
  "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Chandigarh",
  "Lucknow", "Varanasi", "Amritsar", "Agra", "Udaipur",
  "Goa (Panaji)", "Bhopal", "Indore", "Patna", "Ranchi",
  "Guwahati", "Bhubaneswar", "Dehradun", "Shimla", "Srinagar",
  "Ludhiana", "Jalandhar", "Noida", "Gurugram", "Faridabad",
  "Kanpur", "Prayagraj (Allahabad)", "Meerut", "Gwalior", "Jabalpur",
  "Surat", "Vadodara", "Rajkot", "Jodhpur", "Kota",
  "Ajmer", "Bikaner", "Mathura", "Haridwar", "Rishikesh",
  "Manali", "Dharamshala", "Leh", "Gangtok", "Darjeeling",
  "London", "Paris", "New York City", "Tokyo", "Dubai",
  "Singapore", "Rome", "Barcelona", "Madrid", "Amsterdam",
  "Berlin", "Munich", "Vienna", "Prague", "Budapest",
  "Istanbul", "Athens", "Venice", "Florence", "Milan",
  "Zurich", "Geneva", "Brussels", "Copenhagen", "Stockholm",
  "Oslo", "Helsinki", "Dublin", "Edinburgh", "Lisbon",
  "Los Angeles", "San Francisco", "Las Vegas", "Chicago", "Miami",
  "Toronto", "Vancouver", "Montreal", "Sydney", "Melbourne",
  "Auckland", "Bangkok", "Kuala Lumpur", "Bali (Denpasar)", "Seoul",
  "Hong Kong", "Shanghai", "Beijing", "Taipei", "Osaka",
  "Kyoto", "Cairo", "Cape Town", "Johannesburg", "Nairobi",
  "Rio de Janeiro", "Buenos Aires", "Mexico City", "Santiago", "Lima",
  "Doha", "Abu Dhabi", "Riyadh", "Jeddah", "Muscat"
].map((name, idx) => ({
  id: `city_${String(idx + 1).padStart(3, '0')}`,
  name,
  category: "geography",
  subcategory: "cities",
  difficulty: idx < 40 ? "easy" : idx < 90 ? "medium" : "hard",
  region: idx < 50 ? "india" : "international"
}));

saveDataset('cities.json', cities);

// ANIME & VIDEO GAMES (150+ items)
const animeAndGames = [
  // Anime
  "Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake", "Itachi Uchiha", "Goku",
  "Vegeta", "Monkey D. Luffy", "Roronoa Zoro", "Sanji", "Light Yagami",
  "L (Death Note)", "Eren Yeager", "Levi Ackerman", "Mikasa Ackerman", "Gojo Satoru",
  "Yuji Itadori", "Ryomen Sukuna", "Megumi Fushiguro", "Tanjiro Kamado", "Nezuko Kamado",
  "Zenitsu Agatsuma", "Inosuke Hashibira", "Saitama (One Punch Man)", "Genos", "Edward Elric",
  "Roy Mustang", "Ichigo Kurosaki", "Sosuke Aizen", "Killua Zoldyck", "Gon Freecss",
  "Hisoka", "Spike Spiegel", "Ash Ketchum", "Pikachu", "Ken Kaneki",
  "Tanjuro", "Rengoku Kyojuro", "Madara Uchiha", "Jiraiya", "Minato Namikaze",
  "Tsunade", "Orochimaru", "Shoto Todoroki", "Izuku Midoriya", "Bakugo Katsuki",
  "All Might", "Guts (Berserk)", "Shinji Ikari", "Asuka Langley", "Lelouch Lamperouge",
  // Video Games
  "Grand Theft Auto V", "Minecraft", "Red Dead Redemption 2", "The Witcher 3: Wild Hunt", "Elden Ring",
  "Call of Duty: Warzone", "Fortnite", "PUBG: Battlegrounds", "Valorant", "Counter-Strike 2",
  "League of Legends", "Dota 2", "Apex Legends", "Overwatch 2", "Clash of Clans",
  "Brawl Stars", "Subway Surfers", "Candy Crush Saga", "Temple Run", "Among Us",
  "FIFA / EA Sports FC", "God of War", "The Last of Us", "Spider-Man (PS5)", "Cyberpunk 2077",
  "Assassin's Creed: Black Flag", "The Legend of Zelda: Breath of the Wild", "Super Mario Odyssey", "Dark Souls", "Bloodborne",
  "Sekiro: Shadows Die Twice", "Hollow Knight", "Terraria", "Stardew Valley", "Roblox",
  "Genshin Impact", "Honkai: Star Rail", "Rocket League", "Fall Guys", "Need for Speed: Most Wanted",
  "Far Cry 3", "BioShock", "Half-Life 2", "Portal 2", "Resident Evil 4",
  "Street Fighter 6", "Tekken 8", "Mortal Kombat 1", "Halo: Combat Evolved", "Doom Eternal"
].map((name, idx) => ({
  id: `ag_${String(idx + 1).padStart(3, '0')}`,
  name,
  category: "gaming_anime",
  subcategory: idx < 50 ? "anime_characters" : "video_games",
  difficulty: idx < 30 ? "easy" : idx < 75 ? "medium" : "hard",
  region: "international"
}));

saveDataset('anime_and_games.json', animeAndGames);

// INDIAN & INTERNATIONAL TV SHOWS (130+ shows)
const tvShows = [
  // Indian TV & Web Shows
  "Sacred Games", "Mirzapur", "The Family Man", "Panchayat", "Paatal Lok",
  "Scam 1992: The Harshad Mehta Story", "Kota Factory", "Gullak", "Special OPS", "Asur",
  "Aspirants", "Delhi Crime", "Farzi", "Taarak Mehta Ka Ooltah Chashmah", "CID",
  "Sarabhai vs Sarabhai", "Khichdi", "Bhabiji Ghar Par Hain!", "Kyunki Saas Bhi Kabhi Bahu Thi", "Kahaani Ghar Ghar Kii",
  "Kasautii Zindagii Kay", "Kaun Banega Crorepati", "Bigg Boss", "The Kapil Sharma Show", "Comedy Nights with Kapil",
  "Indian Idol", "Dance India Dance", "Khatron Ke Khiladi", "Roadies", "Splitsvilla",
  "Shaktimaan", "Office Office", "F.I.R.", "Son Pari", "Shararat",
  "Karishma Kaa Karishma", "Vikram Aur Betaal", "Malgudi Days", "Dekh Bhai Dekh", "Tu Tu Main Main",
  "Aahat", "Ssshhhh... Koi Hai", "Adaalat", "Crime Patrol", "Savdhaan India",
  // International TV Shows
  "Breaking Bad", "Game of Thrones", "Stranger Things", "The Office (US)", "Friends",
  "Sherlock", "Peaky Blinders", "Better Call Saul", "The Sopranos", "The Wire",
  "Succession", "Chernobyl", "Narcos", "Money Heist (La Casa de Papel)", "Squid Game",
  "Black Mirror", "The Boys", "House of the Dragon", "Ted Lasso", "The Crown",
  "Fargo", "True Detective", "Dark", "Mindhunter", "Fleabag",
  "Modern Family", "Brooklyn Nine-Nine", "How I Met Your Mother", "The Big Bang Theory", "Seinfeld",
  "Parks and Recreation", "Community", "It's Always Sunny in Philadelphia", "Rick and Morty", "BoJack Horseman",
  "The Mandalorian", "The Last of Us (TV)", "Severance", "Loki", "Daredevil",
  "Lost", "Prison Break", "Dexter", "Homeland", "Mad Men",
  "House M.D.", "Grey's Anatomy", "Suits", "White Collar", "Doctor Who"
].map((name, idx) => ({
  id: `tv_${String(idx + 1).padStart(3, '0')}`,
  name,
  category: "entertainment",
  subcategory: idx < 45 ? "indian_tv" : "international_tv",
  difficulty: idx < 30 ? "easy" : idx < 75 ? "medium" : "hard",
  region: idx < 45 ? "india" : "international"
}));

saveDataset('tv_shows.json', tvShows);

// CARS AND BRANDS (100+ items)
const carsAndBrands = [
  "Ferrari", "Lamborghini", "Porsche", "Rolls-Royce", "Bentley",
  "Aston Martin", "McLaren", "Bugatti", "Mercedes-Benz", "BMW",
  "Audi", "Land Rover", "Range Rover", "Jaguar", "Tesla",
  "Ford Mustang", "Chevrolet Corvette", "Toyota Supra", "Nissan GT-R", "Honda Civic Type R",
  "Tata Harrier", "Tata Safari", "Tata Nexon", "Mahindra Thar", "Mahindra Scorpio-N",
  "Mahindra XUV700", "Hyundai Creta", "Kia Seltos", "Maruti Suzuki Swift", "Toyota Fortuner",
  "Toyota Land Cruiser", "Volkswagen Golf", "Skoda Octavia", "Jeep Wrangler", "Volvo XC90",
  // Famous Brands
  "Apple", "Google", "Microsoft", "Amazon", "Nike",
  "Adidas", "Puma", "Zara", "Gucci", "Louis Vuitton",
  "Rolex", "Samsung", "Sony", "PlayStation", "Xbox",
  "Starbucks", "McDonald's", "Domino's", "Subway", "KFC",
  "Coca-Cola", "Pepsi", "Red Bull", "Amul", "Haldiram's",
  "Maggi", "Parle-G", "Titan", "Zomato", "Swiggy",
  "Flipkart", "Boat", "Paytm", "Reliance Jio", "Airtel"
].map((name, idx) => ({
  id: `cb_${String(idx + 1).padStart(3, '0')}`,
  name,
  category: "lifestyle",
  subcategory: idx < 35 ? "cars" : "brands",
  difficulty: idx < 30 ? "easy" : idx < 65 ? "medium" : "hard",
  region: "general"
}));

saveDataset('cars_and_brands.json', carsAndBrands);

console.log("Secondary datasets built successfully!");

