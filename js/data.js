// Friday to Sunday: names and places for generated worlds. Everything is fictional.
"use strict";

const FIRST_NAMES = ["Aaron", "Adrian", "Aiden", "Alex", "Andre", "Andrew", "Angel", "Anthony", "Austin", "Avery", "Bennett", "Blake", "Brady", "Brandon", "Brayden",
  "Brendan", "Brock", "Bryce", "Caleb", "Cameron", "Carlos", "Carson", "Carter", "Casey", "Cedric", "Chase", "Christian", "Cody", "Colby", "Cole", "Colton", "Connor",
  "Cooper", "Corey", "Dakota", "Dalton", "Damian", "Daniel", "Dante", "Darius", "Darnell", "David", "Davis", "Dawson", "Deandre", "Demarcus", "Derek", "Devin", "Dominic",
  "Drew", "Dylan", "Eli", "Elijah", "Emmanuel", "Eric", "Ethan", "Evan", "Ezra", "Gabriel", "Garrett", "Gavin", "Grady", "Grant", "Hayden", "Hector", "Hudson", "Hunter",
  "Isaac", "Isaiah", "Ivan", "Jace", "Jackson", "Jacob", "Jaden", "Jake", "Jalen", "Jamal", "James", "Jamison", "Jared", "Jarvis", "Jason", "Javier", "Jaylen", "Jeremiah",
  "Jesse", "Joel", "Jonah", "Jordan", "Jorge", "Jose", "Joseph", "Josh", "Josiah", "Julian", "Justin", "Kade", "Kaleb", "Keegan", "Keith", "Kendall", "Kenny", "Kevin",
  "Khalil", "Kobe", "Kyle", "Lamar", "Landon", "Levi", "Liam", "Logan", "Lucas", "Luis", "Luke", "Malik", "Marcus", "Mario", "Mason", "Mateo", "Matthew", "Max", "Micah",
  "Miguel", "Miles", "Mitchell", "Nate", "Nathan", "Nick", "Noah", "Nolan", "Omar", "Owen", "Parker", "Patrick", "Quentin", "Quinn", "Rafael", "Reed", "Reggie", "Ricky",
  "Riley", "Roman", "Ryan", "Ryder", "Sam", "Santiago", "Sawyer", "Sean", "Seth", "Shane", "Silas", "Spencer", "Stefan", "Terrell", "Terrence", "Thomas", "Tanner", "Trent",
  "Trevor", "Tristan", "Troy", "Tucker", "Tyler", "Tyrese", "Tyson", "Victor", "Wade", "Wesley", "Weston", "Will", "Wyatt", "Xavier", "Zach", "Zane"];
// A few kickers are girls from the soccer team, like at plenty of real small schools
const FIRST_NAMES_K = ["Abby", "Brooke", "Emma", "Hailey", "Jenna", "Kayla", "Lexi", "Maddie", "Riley", "Sophia"];
const LAST_NAMES = ["Abbott", "Acosta", "Adkins", "Aldridge", "Alvarez", "Archer", "Atwood", "Bailey", "Baker", "Banks", "Barker", "Barnes", "Beasley", "Bell", "Benson",
  "Bishop", "Blackwell", "Bolton", "Bowman", "Boyd", "Bradford", "Brewer", "Briggs", "Brooks", "Bryant", "Burke", "Burton", "Bush", "Byrd", "Caldwell", "Callahan",
  "Campbell", "Cannon", "Carr", "Carver", "Castillo", "Chambers", "Chandler", "Chavez", "Clark", "Clayton", "Cobb", "Coleman", "Collins", "Conley", "Cooper", "Cortez",
  "Crawford", "Cross", "Cruz", "Curtis", "Dalton", "Daniels", "Davenport", "Dawson", "Dean", "Delgado", "Dixon", "Dorsey", "Douglas", "Duncan", "Dunn", "Easley", "Edwards",
  "Ellis", "Espinoza", "Evans", "Farmer", "Ferguson", "Fields", "Fleming", "Flores", "Ford", "Foster", "Fowler", "Franklin", "Frazier", "Fuller", "Gaines", "Garner",
  "Garrett", "Gibbs", "Gilbert", "Glover", "Gordon", "Graham", "Graves", "Gray", "Greer", "Griffin", "Guerrero", "Hale", "Hamilton", "Hancock", "Hardin", "Harmon",
  "Harper", "Hartley", "Hawkins", "Hayes", "Henderson", "Hendrix", "Herrera", "Hicks", "Hill", "Hines", "Hobbs", "Holland", "Holt", "Hopkins", "Horton", "Houston",
  "Howell", "Hubbard", "Hudson", "Hughes", "Hunt", "Ingram", "Jacobs", "Jefferson", "Jennings", "Jordan", "Keller", "Kemp", "Kendrick", "Kidd", "Kirby", "Knight",
  "Lambert", "Lane", "Lawson", "Leblanc", "Lindsey", "Little", "Logan", "Lowe", "Lucero", "Lynch", "Mack", "Maddox", "Malone", "Manning", "Marsh", "Mathis", "Maxwell",
  "McBride", "McCoy", "McDaniel", "McKinney", "Medina", "Mercer", "Miles", "Mills", "Molina", "Monroe", "Moody", "Morales", "Moreno", "Morrow", "Moss", "Munoz", "Nash",
  "Navarro", "Neal", "Nelson", "Nichols", "Norris", "Oliver", "Ortega", "Owens", "Pace", "Padilla", "Palmer", "Parks", "Patton", "Payne", "Pearson", "Pena", "Perkins",
  "Pierce", "Pittman", "Porter", "Pratt", "Preston", "Price", "Quinn", "Ramos", "Randall", "Reese", "Reeves", "Rhodes", "Rios", "Rivers", "Robbins", "Rocha", "Rollins",
  "Rowe", "Russell", "Salazar", "Sanders", "Sandoval", "Savage", "Sawyer", "Schultz", "Shaw", "Shelton", "Simmons", "Slater", "Sloan", "Spencer", "Stafford", "Steele",
  "Stokes", "Strickland", "Sutton", "Tate", "Terry", "Thornton", "Tillman", "Todd", "Townsend", "Tucker", "Turner", "Underwood", "Valdez", "Vance", "Vaughn", "Vega",
  "Wade", "Walker", "Wallace", "Walton", "Ward", "Warren", "Watkins", "Weaver", "Webb", "Wheeler", "Whitaker", "Wilcox", "Wiley", "Willis", "Wolfe", "Woodard",
  "Wright", "Wyatt", "Yates", "York", "Young", "Zamora"];
const TOWN_FIRST = ["Pine", "Cedar", "Oak", "Elm", "Maple", "Willow", "Birch", "Aspen", "Hickory", "Walnut", "Cotton", "Prairie", "Stone", "Iron", "Copper", "Silver",
  "Red", "Black", "Green", "Clear", "Rock", "Sand", "Salt", "Mill", "Fox", "Deer", "Elk", "Bear", "Hawk", "Crow", "Spring", "Grand", "Long", "Twin", "Lake", "Glen",
  "Fair", "Ash", "Pecan", "Sumner", "Lyle", "Haw", "Briar", "Flint", "Cold", "Mossy", "Wolf", "Crane", "Pike", "Union"];
const TOWN_LAST = ["ville", "ton", "field", "wood", "brook", "dale", " Creek", " Hollow", " Springs", " Valley", " Ridge", " Falls", " Grove", " Bend", " Hill",
  " Point", " Junction", "burg", " Flats", " Center", " Fork", " Gap", " Mills", " Crossing"];
// Some towns go by one plain name
const TOWNS = ["Harlan", "Corbin", "Delmar", "Avalon", "Bristow", "Calloway", "Danforth", "Elkins", "Fenwick", "Garland", "Halstead", "Ivesdale", "Jasper", "Kinsley",
  "Lockhart", "Marlow", "Newbern", "Odessa", "Pomeroy", "Quitman", "Rexford", "Selby", "Tolland", "Ulster", "Vandalia", "Waverly", "Yarbrough", "Zeigler", "Ashby",
  "Bellmont", "Carver", "Dunmore", "Eldon", "Frankton", "Gilman", "Hatfield", "Kessler", "Linwood", "Mayfield", "Norwood", "Orland", "Pruitt", "Ramsey", "Stanton",
  "Talbot", "Vernon", "Weldon", "Whitley", "Arden", "Belton"];
// Team names, always plural so sentences read "The Panthers kick off"
const MASCOTS = ["Panthers", "Eagles", "Wildcats", "Tigers", "Bulldogs", "Hornets", "Mustangs", "Rams", "Falcons", "Hawks", "Cougars", "Bobcats", "Lions", "Bears",
  "Knights", "Spartans", "Trojans", "Vikings", "Pirates", "Raiders", "Pioneers", "Cardinals", "Blue Jays", "Owls", "Badgers", "Wolverines", "Wolves", "Coyotes",
  "Broncos", "Chargers", "Comets", "Rockets", "Mavericks", "Huskies", "Lumberjacks", "Miners", "Bison", "Longhorns", "Golden Bears", "Blue Devils", "Yellow Jackets",
  "Gators", "Hurricanes", "Cyclones", "Bearcats", "Greyhounds", "Jaguars", "Stallions", "Rattlers", "Scorpions", "Grizzlies", "Thunderbirds", "Ravens", "Jackrabbits"];
// School colors: [hex, name, family]. Dark enough for white text on top. Two teams in a game never
// share a family, so they're easy to tell apart.
const SCHOOL_COLORS = [["#A3242F", "Crimson", "red"], ["#22407D", "Navy", "blue"], ["#C95A17", "Orange", "orange"], ["#5A3990", "Purple", "purple"],
  ["#167370", "Teal", "teal"], ["#9A7209", "Gold", "gold"], ["#2F6A35", "Green", "green"], ["#2B2B2B", "Black", "gray"], ["#7A1F2B", "Maroon", "red"],
  ["#2147A8", "Royal blue", "blue"], ["#B22222", "Scarlet", "red"], ["#3B6E99", "Columbia blue", "blue"], ["#6B4423", "Brown", "gold"],
  ["#1F5A3A", "Forest green", "green"], ["#8E2346", "Cardinal", "red"], ["#4A4F57", "Steel gray", "gray"]];
const COACH_FIRST = ["Bill", "Bob", "Buck", "Carl", "Chuck", "Dale", "Dan", "Darrell", "Dave", "Don", "Doug", "Earl", "Frank", "Gary", "Gene", "Greg", "Hank", "Jim",
  "Joe", "Ken", "Larry", "Lou", "Mark", "Mike", "Phil", "Ray", "Rick", "Ron", "Russ", "Scott", "Steve", "Ted", "Terry", "Tom", "Tony", "Walt", "Wayne", "Linda",
  "Andre", "Marcus", "Luis", "Carlos", "Derrick", "Keith", "Curtis", "Reggie"];
